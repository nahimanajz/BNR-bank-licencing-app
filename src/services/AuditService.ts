import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { Logger } from 'winston';

interface AuditParams {
  userId: number;
  applicationId: number;
  action: string;
  beforeState: string | null;
  afterState: string | null;
  details?: Record<string, unknown>;
}

export class AuditService {
  private auditLogRepository: AuditLogRepository;
  private logger: Logger;

  constructor(auditLogRepository: AuditLogRepository, logger: Logger) {
    this.auditLogRepository = auditLogRepository;
    this.logger = logger;
  }

  async log(params: AuditParams): Promise<void> {
    await this.auditLogRepository.create({
      user_id: params.userId,
      application_id: params.applicationId,
      action: params.action,
      before_state: params.beforeState,
      after_state: params.afterState,
      details: params.details ?? null,
    });

    this.logger.info('Audit logged', {
      action: params.action,
      applicationId: params.applicationId,
      userId: params.userId,
    });
  }
}
