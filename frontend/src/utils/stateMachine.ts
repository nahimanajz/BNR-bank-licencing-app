import { ApplicationStatus, UserRole } from '@/types';

const ROLE_TRANSITIONS: Record<string, Partial<Record<ApplicationStatus, ApplicationStatus[]>>> = {
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

type Handler = 'transition' | 'feedback' | 'decide';

export interface TransitionAction {
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  handler: Handler;
  requiresTextarea: boolean;
  textareaPlaceholder?: string;
  decideValue?: 'APPROVE' | 'REJECT';
}

export const TRANSITION_ACTIONS: Partial<Record<ApplicationStatus, TransitionAction>> = {
  SUBMITTED: {
    label: 'Submit Application',
    variant: 'primary',
    handler: 'transition',
    requiresTextarea: false,
  },
  UNDER_REVIEW: {
    label: 'Start Review',
    variant: 'primary',
    handler: 'transition',
    requiresTextarea: false,
  },
  CLARIFICATION_REQUESTED: {
    label: 'Request Clarification',
    variant: 'ghost',
    handler: 'feedback',
    requiresTextarea: true,
    textareaPlaceholder: 'Describe what the applicant needs to provide...',
  },
  RESUBMITTED: {
    label: 'Mark as Resubmitted',
    variant: 'primary',
    handler: 'transition',
    requiresTextarea: false,
  },
  DECISION_PENDING: {
    label: 'Send for Decision',
    variant: 'secondary',
    handler: 'transition',
    requiresTextarea: false,
  },
  APPROVED: {
    label: 'Approve',
    variant: 'primary',
    handler: 'decide',
    requiresTextarea: true,
    textareaPlaceholder: 'Decision notes...',
    decideValue: 'APPROVE',
  },
  REJECTED: {
    label: 'Reject',
    variant: 'danger',
    handler: 'decide',
    requiresTextarea: true,
    textareaPlaceholder: 'Decision notes...',
    decideValue: 'REJECT',
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
