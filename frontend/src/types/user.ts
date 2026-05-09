export enum UserRole {
  APPLICANT = 'APPLICANT',
  REVIEWER = 'REVIEWER',
  APPROVER = 'APPROVER',
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name: string | null;
  token?: string;
}
