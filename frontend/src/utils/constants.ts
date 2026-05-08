import { ApplicationStatus } from '@/types';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  CLARIFICATION_REQUESTED: 'Clarification Requested',
  RESUBMITTED: 'Resubmitted',
  DECISION_PENDING: 'Decision Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  CLARIFICATION_REQUESTED: 'bg-orange-100 text-orange-700',
  RESUBMITTED: 'bg-purple-100 text-purple-700',
  DECISION_PENDING: 'bg-cyan-100 text-cyan-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export const TERMINAL_STATES: ApplicationStatus[] = ['APPROVED', 'REJECTED'];
