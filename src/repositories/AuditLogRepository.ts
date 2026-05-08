import { AuditLog } from '../models/index';
import { BaseRepository } from './BaseRepository';

export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor(model: typeof AuditLog) {
    super(model);
  }

  async findByApplicationId(applicationId: number): Promise<AuditLog[]> {
    return this.model.findAll({
      where: { application_id: applicationId } as any,
      order: [['created_at', 'DESC']],
    });
  }

  async findByUserId(userId: number): Promise<AuditLog[]> {
    return this.model.findAll({
      where: { user_id: userId } as any,
      order: [['created_at', 'DESC']],
    });
  }
}
