import { ApplicationStatus, UserRole, DecisionValue } from '@/types';
import { TransitionHandler, TransitionAction, TransitionMap } from '@/types/state-machine';

export { TransitionHandler };
export type { TransitionAction, TransitionMap };

// duplicates backend — keep in sync
const ROLE_TRANSITIONS: Record<string, Partial<Record<ApplicationStatus, ApplicationStatus[]>>> = {
  [UserRole.APPLICANT]: {
    [ApplicationStatus.DRAFT]: [ApplicationStatus.SUBMITTED],
    [ApplicationStatus.CLARIFICATION_REQUESTED]: [ApplicationStatus.RESUBMITTED],
  },
  [UserRole.REVIEWER]: {
    [ApplicationStatus.SUBMITTED]: [ApplicationStatus.UNDER_REVIEW],
    [ApplicationStatus.UNDER_REVIEW]: [ApplicationStatus.CLARIFICATION_REQUESTED, ApplicationStatus.DECISION_PENDING],
    [ApplicationStatus.RESUBMITTED]: [ApplicationStatus.UNDER_REVIEW],
  },
  [UserRole.APPROVER]: {
    [ApplicationStatus.DECISION_PENDING]: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
  },
};

export const TRANSITION_ACTIONS: TransitionMap = {
  [ApplicationStatus.SUBMITTED]: {
    label: 'Submit Application',
    variant: 'primary',
    handler: TransitionHandler.TRANSITION,
    requiresTextarea: false,
  },
  [ApplicationStatus.UNDER_REVIEW]: {
    label: 'Start Review',
    variant: 'primary',
    handler: TransitionHandler.TRANSITION,
    requiresTextarea: false,
  },
  [ApplicationStatus.CLARIFICATION_REQUESTED]: {
    label: 'Request Clarification',
    variant: 'ghost',
    handler: TransitionHandler.FEEDBACK,
    requiresTextarea: true,
    textareaPlaceholder: 'Describe what the applicant needs to provide...',
  },
  [ApplicationStatus.RESUBMITTED]: {
    label: 'Mark as Resubmitted',
    variant: 'primary',
    handler: TransitionHandler.TRANSITION,
    requiresTextarea: false,
  },
  [ApplicationStatus.DECISION_PENDING]: {
    label: 'Send for Decision',
    variant: 'secondary',
    handler: TransitionHandler.TRANSITION,
    requiresTextarea: false,
  },
  [ApplicationStatus.APPROVED]: {
    label: 'Approve',
    variant: 'primary',
    handler: TransitionHandler.DECIDE,
    requiresTextarea: true,
    textareaPlaceholder: 'Decision notes...',
    decideValue: DecisionValue.APPROVE,
  },
  [ApplicationStatus.REJECTED]: {
    label: 'Reject',
    variant: 'danger',
    handler: TransitionHandler.DECIDE,
    requiresTextarea: true,
    textareaPlaceholder: 'Decision notes...',
    decideValue: DecisionValue.REJECT,
  },
};

export const getNextStates = (
  currentStatus: ApplicationStatus,
  role: UserRole | string
): ApplicationStatus[] => {
  return ROLE_TRANSITIONS[role]?.[currentStatus] ?? [];
};

export const canTransition = (
  from: ApplicationStatus,
  to: ApplicationStatus,
  role: UserRole | string
): boolean => {
  return getNextStates(from, role).includes(to);
};
