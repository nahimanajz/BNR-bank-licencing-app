'use client';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useLogin } from '@/hooks/useAuth';
import { Button } from '@/components/Common/Button';
import { ErrorAlert } from '@/components/Common/ErrorAlert';
import { ApiError } from '@/types';
import { LoginFormValues } from '@/types/forms';

export const LoginView = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();
  const mutation = useLogin();

  return (
    <div className="min-h-screen bg-bnr-light flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-bnr-dark">BNR Licensing Portal</h1>
          <p className="text-sm text-bnr-gray mt-1">Sign in to your account</p>
        </div>

        {mutation.isError && (
          <ErrorAlert
            message={(mutation.error as ApiError)?.message || 'Invalid credentials'}
          />
        )}

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-bnr-gray mb-1">Email</label>
            <input
              {...register('email', { required: 'Email is required' })}
              type="email"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bnr-teal"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-bnr-gray mb-1">Password</label>
            <input
              {...register('password', { required: 'Password is required' })}
              type="password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bnr-teal"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
          <Button type="submit" loading={mutation.isPending} className="w-full">
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-bnr-gray">
          No account?{' '}
          <Link href="/signup" className="text-bnr-teal hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
