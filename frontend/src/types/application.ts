export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CLARIFICATION_REQUESTED = 'CLARIFICATION_REQUESTED',
  RESUBMITTED = 'RESUBMITTED',
  DECISION_PENDING = 'DECISION_PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum DecisionValue {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export interface Application {
  id: number;
  applicant_id: number;
  institution_name: string;
  status: ApplicationStatus;
  current_reviewer_id: number | null;
  current_approver_id: number | null;
  reviewer_feedback: string | null;
  decision_notes: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationPayload {
  institution_name: string;
}

export interface TransitionPayload {
  id: number;
  newStatus: ApplicationStatus;
  version: number;
}

export interface FeedbackPayload {
  id: number;
  feedback: string;
  version: number;
}

export interface DecidePayload {
  id: number;
  decision: DecisionValue;
  notes: string;
  version: number;
}
