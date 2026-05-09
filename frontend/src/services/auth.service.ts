import apiClient from '../config/api.client';
import { User } from '@/types';
import { LoginPayload, SignupPayload, AuthResponse } from '@/types/auth';

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', payload);
    const { token, ...user } = data.data;
    return { user: user as User, token };
  },

  signup: async (payload: SignupPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/signup', payload);
    const { token, ...user } = data.data;
    return { user, token };
  },
};
