import { AuthorizationError, InvalidTransitionError } from '../utils/errors';

const TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['CLARIFICATION_REQUESTED', 'DECISION_PENDING'],
  CLARIFICATION_REQUESTED: ['RESUBMITTED'],
  RESUBMITTED: ['UNDER_REVIEW'],
  DECISION_PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: [],
};

const ROLE_TRANSITIONS: Record<string, Record<string, string[]>> = {
  APPLICANT: {
    DRAFT: ['SUBMITTED'],
    CLARIFICATION_REQUESTED: ['RESUBMITTED'],
  },
  REVIEWER: {
    SUBMITTED: ['UNDER_REVIEW'],
    UNDER_REVIEW: ['CLARIFICATION_REQUESTED', 'DECISION_PENDING'],
    RESUBMITTED: ['UNDER_REVIEW'],
  },
  APPROVER: {
    DECISION_PENDING: ['APPROVED', 'REJECTED'],
  },
};

export class StateMachineService {
  validateTransition(currentState: string, nextState: string, role: string): void {
    if (!TRANSITIONS[currentState]?.includes(nextState)) {
      throw new InvalidTransitionError(
        `Cannot transition from ${currentState} to ${nextState}`
      );
    }
    if (!ROLE_TRANSITIONS[role]?.[currentState]?.includes(nextState)) {
      throw new AuthorizationError(`${role} cannot perform this transition`);
    }
  }

  getNextStates(currentState: string, role: string): string[] {
    return ROLE_TRANSITIONS[role]?.[currentState] ?? [];
  }
}
