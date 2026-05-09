import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import { LoginPayload, SignupPayload } from '@/types/auth';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const useLogin = () => {
  const router = useRouter();
  const { login } = useAuth();

  return useMutation({
    mutationFn: (credentials: LoginPayload) => authService.login(credentials),
    onSuccess: (data) => {
      login(data);
      router.push('/applications');
    },
    // TODO: should we redirect to /login on 401? the interceptor might already do this
  });
};

export const useSignup = () => {
  const router = useRouter();
  const { login } = useAuth();

  return useMutation({
    mutationFn: (payload: SignupPayload) => authService.signup(payload),
    onSuccess: (data) => {
      login(data);
      router.push('/applications');
    },
  });
};
