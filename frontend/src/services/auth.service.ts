import { SignupPayload } from './../types/user/SignupPayload';
import { LoginPayload } from '@/types/user/LoginPayload';
import apiClient from '../config/api.client';
import { User } from '@/types';


export const authService = {
  login: async (payload: LoginPayload): Promise<{ user: User; token: string }> => {
    const { data } = await apiClient.post('/auth/login', payload);
    const { token, ...user } = data.data;
    return { user: user as User, token };
  },

  signup: async (payload: SignupPayload): Promise<{ user: User; token: string }> => {
    const { data } = await apiClient.post('/auth/signup', payload);
    const { token, ...user } = data.data;
    return { user, token };
  },
};
