import { ApplicationRepository } from '../repositories/ApplicationRepository';
import { AuthorizationError } from '../utils/errors';

export class AuthorizationService {
  private applicationRepository: ApplicationRepository;

  constructor(applicationRepository: ApplicationRepository) {
    this.applicationRepository = applicationRepository;
  }

  async canReview(userId: number, applicationId: number): Promise<void> {
    const app = await this.applicationRepository.findById(applicationId);
    if (app.current_approver_id === userId) {
      throw new AuthorizationError('Cannot review an application you are set to approve');
    }
  }

  async canApprove(userId: number, applicationId: number): Promise<void> {
    const app = await this.applicationRepository.findById(applicationId);
    if (app.current_reviewer_id === userId) {
      throw new AuthorizationError('Cannot approve an application you reviewed');
    }
  }
}
