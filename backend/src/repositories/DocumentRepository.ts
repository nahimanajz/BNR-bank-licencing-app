import { Document } from '../models/index';
import { BaseRepository } from './BaseRepository';

export class DocumentRepository extends BaseRepository<Document> {
  constructor(model: typeof Document) {
    super(model);
  }

  async findByApplicationId(applicationId: number): Promise<Document[]> {
    return this.model.findAll({
      where: { application_id: applicationId } as any,
      order: [['created_at', 'ASC']],
    });
  }

  async countByApplicationId(applicationId: number): Promise<number> {
    return this.model.count({ where: { application_id: applicationId } as any });
  }
}
