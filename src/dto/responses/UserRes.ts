export interface UserRes {
  id: number;
  email: string;
  role: string;
  full_name: string | null;
  token: string;
}
