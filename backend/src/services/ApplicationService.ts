import { ApplicationRepository } from '../repositories/ApplicationRepository';
import { AuditService } from './AuditService';
import { StateMachineService } from './StateMachineService';
import { AuthorizationService } from './AuthorizationService';
import { AuthorizationError } from '../utils/errors';
import { Application } from '../models/index';

interface CreateApplicationParams {
  applicant_id: number;
  institution_name: string;
}

export class ApplicationService {
  private applicationRepository: ApplicationRepository;
  private auditService: AuditService;
  private stateMachine: StateMachineService;
  private authorizationService: AuthorizationService;

  constructor(
    applicationRepository: ApplicationRepository,
    auditService: AuditService,
    stateMachine: StateMachineService,
    authorizationService: AuthorizationService
  ) {
    this.applicationRepository = applicationRepository;
    this.auditService = auditService;
    this.stateMachine = stateMachine;
    this.authorizationService = authorizationService;
  }

  async createApplication(params: CreateApplicationParams): Promise<Application> {
    const app = await this.applicationRepository.create({
      applicant_id: params.applicant_id,
      institution_name: params.institution_name,
      status: 'DRAFT',
    });

    await this.auditService.log({
      userId: params.applicant_id,
      applicationId: app.id,
      action: 'CREATED',
      beforeState: null,
      afterState: 'DRAFT',
    });

    return app;
  }

  async listApplications(userId: number, role: string): Promise<Application[]> {
    if (role === 'APPLICANT') {
      return this.applicationRepository.findByApplicantId(userId);
    }
    return this.applicationRepository.findAll();
  }

  async getApplicationWithPermission(applicationId: number, userId: number, role: string): Promise<Application> {
    const app = await this.applicationRepository.findById(applicationId);
    if (role === 'APPLICANT' && app.applicant_id !== userId) {
      throw new AuthorizationError('Forbidden');
    }
    return app;
  }

  async transition(applicationId: number, userId: number, role: string, newStatus: string, version: number): Promise<Application> {
    const app = await this.applicationRepository.findById(applicationId);
    this.stateMachine.validateTransition(app.status, newStatus, role);

    if (role === 'REVIEWER') {
      await this.authorizationService.canReview(userId, applicationId);
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    if (role === 'REVIEWER' && newStatus === 'UNDER_REVIEW') {
      updateData.current_reviewer_id = userId;
    }

    const updated = await this.applicationRepository.updateWithVersion(applicationId, updateData, version);

    await this.auditService.log({
      userId,
      applicationId,
      action: newStatus,
      beforeState: app.status,
      afterState: newStatus,
    });

    return updated;
  }

  async provideFeedback(applicationId: number, userId: number, feedback: string, version: number): Promise<Application> {
    await this.authorizationService.canReview(userId, applicationId);

    const app = await this.applicationRepository.findById(applicationId);
    this.stateMachine.validateTransition(app.status, 'CLARIFICATION_REQUESTED', 'REVIEWER');

    const beforeState = app.status;
    const updated = await this.applicationRepository.updateWithVersion(
      applicationId,
      { status: 'CLARIFICATION_REQUESTED', reviewer_feedback: feedback, current_reviewer_id: userId },
      version
    );

    await this.auditService.log({
      userId,
      applicationId,
      action: 'CLARIFICATION_REQUESTED',
      beforeState,
      afterState: 'CLARIFICATION_REQUESTED',
      details: { feedback },
    });

    return updated;
  }

  async decide(applicationId: number, userId: number, decision: string, notes: string, version: number): Promise<Application> {
    await this.authorizationService.canApprove(userId, applicationId);

    const app = await this.applicationRepository.findById(applicationId);
    const nextStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    this.stateMachine.validateTransition(app.status, nextStatus, 'APPROVER');

    const beforeState = app.status;
    const updated = await this.applicationRepository.updateWithVersion(
      applicationId,
      { status: nextStatus, decision_notes: notes, current_approver_id: userId },
      version
    );

    await this.auditService.log({
      userId,
      applicationId,
      action: nextStatus,
      beforeState,
      afterState: nextStatus,
      details: { notes },
    });

    return updated;
  }
}
