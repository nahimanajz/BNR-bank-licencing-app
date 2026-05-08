import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const useLogin = () => {
  const router = useRouter();
  const { login } = useAuth();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      authService.login(credentials),
    onSuccess: (data) => {
      login(data);
      router.push('/applications');
    },
  });
};

export const useSignup = () => {
  const router = useRouter();
  const { login } = useAuth();

  return useMutation({
    mutationFn: (payload: { email: string; password: string; role: string; full_name?: string }) =>
      authService.signup(payload),
    onSuccess: (data) => {
      login(data);
      router.push('/applications');
    },
  });
};
