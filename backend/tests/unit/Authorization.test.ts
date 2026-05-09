import { AuthorizationService } from '../../src/services/AuthorizationService';
import { AuthorizationError } from '../../src/utils/errors';

const mockRepo = { findById: jest.fn() };
const svc = new AuthorizationService(mockRepo as any);

beforeEach(() => jest.clearAllMocks());

describe('AuthorizationService.canApprove — reviewer cannot approve their own review', () => {
  test('throws when the acting user is the assigned reviewer', async () => {
    mockRepo.findById.mockResolvedValue({ current_reviewer_id: 5, current_approver_id: null });
    await expect(svc.canApprove(5, 1)).rejects.toThrow(AuthorizationError);
  });

  test('allows approval by a different user', async () => {
    mockRepo.findById.mockResolvedValue({ current_reviewer_id: 5, current_approver_id: null });
    await expect(svc.canApprove(9, 1)).resolves.toBeUndefined();
  });

  test('allows approval when no reviewer has been set yet', async () => {
    mockRepo.findById.mockResolvedValue({ current_reviewer_id: null, current_approver_id: null });
    await expect(svc.canApprove(5, 1)).resolves.toBeUndefined();
  });
});

describe('AuthorizationService.canReview — approver cannot review what they will decide', () => {
  test('throws when the acting user is the assigned approver', async () => {
    mockRepo.findById.mockResolvedValue({ current_reviewer_id: null, current_approver_id: 7 });
    await expect(svc.canReview(7, 1)).rejects.toThrow(AuthorizationError);
  });

  test('allows review by a different user than the approver', async () => {
    mockRepo.findById.mockResolvedValue({ current_reviewer_id: null, current_approver_id: 7 });
    await expect(svc.canReview(3, 1)).resolves.toBeUndefined();
  });

  test('allows review when no approver has been set yet', async () => {
    mockRepo.findById.mockResolvedValue({ current_reviewer_id: null, current_approver_id: null });
    await expect(svc.canReview(7, 1)).resolves.toBeUndefined();
  });
});

describe('Role boundary integration — what each role can reach', () => {
  // These assert the ROLE_TRANSITIONS table in StateMachineService indirectly
  // through the service layer. The unit tests in StateMachine.test.ts cover
  // the service directly; these tests cover the authorization guard layer.

  test('reviewer is blocked from approving after having reviewed', async () => {
    // Simulates: reviewer 5 is set as current_reviewer, then tries to approve.
    mockRepo.findById.mockResolvedValue({ current_reviewer_id: 5, current_approver_id: null });
    await expect(svc.canApprove(5, 42)).rejects.toThrow(
      'Cannot approve an application you reviewed'
    );
  });

  test('approver is blocked from reviewing after having been set as approver', async () => {
    mockRepo.findById.mockResolvedValue({ current_reviewer_id: null, current_approver_id: 10 });
    await expect(svc.canReview(10, 42)).rejects.toThrow(
      'Cannot review an application you are set to approve'
    );
  });
});
