import { AuditLogRepository } from '../repositories/AuditLogRepository';

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

  constructor(auditLogRepository: AuditLogRepository) {
    this.auditLogRepository = auditLogRepository;
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
  }
}
