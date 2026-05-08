export type UserRole = 'APPLICANT' | 'REVIEWER' | 'APPROVER' | 'ADMIN';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CLARIFICATION_REQUESTED'
  | 'RESUBMITTED'
  | 'DECISION_PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name: string | null;
  token?: string;
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
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  application_id: number;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string | null;
  uploader_id: number;
  version: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  application_id: number;
  action: string;
  before_state: string | null;
  after_state: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface ApiError {
  status?: number;
  message: string;
}
