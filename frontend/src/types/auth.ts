import type { User, UserRole } from './user';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  role: UserRole;
  full_name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
}
