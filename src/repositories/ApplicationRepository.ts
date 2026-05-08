import { Application } from '../models/index';
import { BaseRepository } from './BaseRepository';
import { ConflictError } from '../utils/errors';

export class ApplicationRepository extends BaseRepository<Application> {
  constructor(model: typeof Application) {
    super(model);
  }

  async findByApplicantId(applicantId: number): Promise<Application[]> {
    return this.findAll({ applicant_id: applicantId } as any);
  }

  async findByStatus(status: string): Promise<Application[]> {
    return this.findAll({ status } as any);
  }

  async updateWithVersion(id: number, data: object, expectedVersion: number): Promise<Application> {
    const [rowsUpdated] = await this.model.update(
      { ...data, version: expectedVersion + 1 },
      { where: { id, version: expectedVersion } }
    );
    if (rowsUpdated === 0) {
      throw new ConflictError('Application was updated by another user');
    }
    return this.findById(id);
  }
}
