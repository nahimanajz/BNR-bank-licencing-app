import { AuditLog } from '../models/index';
import { BaseRepository } from './BaseRepository';

export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor(model: typeof AuditLog) {
    super(model);
  }

  async findByApplicationId(applicationId: number): Promise<AuditLog[]> {
    return this.model.findAll({
      where: { application_id: applicationId } as any,
      order: [['created_at', 'ASC']],
    });
  }

  async findAll(where: object = {}): Promise<AuditLog[]> {
    return this.model.findAll({ where: where as any, order: [['created_at', 'ASC']] });
  }

  // Audit records are permanent legal evidence — mutations are not permitted.
  override async update(): Promise<never> {
    throw new Error('Audit log records are immutable and cannot be modified');
  }
}
