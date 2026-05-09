export interface AuditLog {
  id: number;
  user_id: number;
  application_id: number;
  action: string;
  before_state: string | null;
  after_state: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}
