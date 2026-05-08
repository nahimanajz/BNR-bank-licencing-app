import { Request, Response, NextFunction } from 'express';
import { AuditLogRepository } from '../repositories/AuditLogRepository';

export class AuditController {
  private auditLogRepository: AuditLogRepository;

  constructor(auditLogRepository: AuditLogRepository) {
    this.auditLogRepository = auditLogRepository;
  }

  listByApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const applicationId = Number(req.params.id ?? req.query.applicationId);
      const logs = await this.auditLogRepository.findByApplicationId(applicationId);
      res.status(200).json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  };
}
