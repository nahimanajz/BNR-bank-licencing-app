import { ApplicationStatus, FeedbackVariant, UserRole } from '@/types';


export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'Draft',
  [ApplicationStatus.SUBMITTED]: 'Submitted',
  [ApplicationStatus.UNDER_REVIEW]: 'Under Review',
  [ApplicationStatus.CLARIFICATION_REQUESTED]: 'Clarification Requested',
  [ApplicationStatus.RESUBMITTED]: 'Resubmitted',
  [ApplicationStatus.DECISION_PENDING]: 'Decision Pending',
  [ApplicationStatus.APPROVED]: 'Approved',
  [ApplicationStatus.REJECTED]: 'Rejected',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'bg-gray-100 text-gray-700',
  [ApplicationStatus.SUBMITTED]: 'bg-blue-100 text-blue-700',
  [ApplicationStatus.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-700',
  [ApplicationStatus.CLARIFICATION_REQUESTED]: 'bg-orange-100 text-orange-700',
  [ApplicationStatus.RESUBMITTED]: 'bg-purple-100 text-purple-700',
  [ApplicationStatus.DECISION_PENDING]: 'bg-cyan-100 text-cyan-700',
  [ApplicationStatus.APPROVED]: 'bg-green-100 text-green-700',
  [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-700',
};

export const TERMINAL_STATES: ApplicationStatus[] = [
  ApplicationStatus.APPROVED,
  ApplicationStatus.REJECTED,
];

export const ASSIGNABLE_ROLES: UserRole[] = [
  UserRole.APPLICANT,
  UserRole.REVIEWER,
  UserRole.APPROVER,
];

///Below there are list of re-usable feedback colors
export const VARIANT_STYLES: Record<FeedbackVariant, string> = {
  warning: 'bg-amber-50 border-amber-200',
  success: 'bg-green-50 border-green-200',
  danger: 'bg-red-50 border-red-200',
};

export const LABEL_STYLES: Record<FeedbackVariant, string> = {
  warning: 'text-amber-700',
  success: 'text-green-700',
  danger: 'text-red-700',
};

export const BODY_STYLES: Record<FeedbackVariant, string> = {
  warning: 'text-amber-800',
  success: 'text-green-800',
  danger: 'text-red-800',
};