import { ApplicationStatus, UserRole } from '@/types';

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
