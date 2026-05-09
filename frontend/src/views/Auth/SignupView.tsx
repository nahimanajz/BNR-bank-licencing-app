'use client';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useSignup } from '@/hooks/useAuth';
import { Button } from '@/components/Common/Button';
import { ErrorAlert } from '@/components/Common/ErrorAlert';
import { ApiError, UserRole } from '@/types';
import { SignupFormValues } from '@/types/forms';
import { ASSIGNABLE_ROLES } from '@/utils/constants';

export const SignupView = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    defaultValues: { role: UserRole.APPLICANT },
  });
  const mutation = useSignup();

  return (
    <div className="min-h-screen bg-bnr-light flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-bnr-dark">Create Account</h1>
          <p className="text-sm text-bnr-gray mt-1">BNR Bank Licensing Portal</p>
        </div>

        {mutation.isError && (
          <ErrorAlert message={(mutation.error as ApiError)?.message || 'Signup failed'} />
        )}

        <form onSubmit={handleSubmit((v) => mutation.mutate({ ...v, role: v.role as UserRole }))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bnr-gray mb-1">Full Name</label>
            <input
              {...register('full_name')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bnr-teal"
            />
          </div>
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
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
              type="password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bnr-teal"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-bnr-gray mb-1">Role</label>
            <select
              {...register('role')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bnr-teal"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <Button type="submit" loading={mutation.isPending} className="w-full">
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-bnr-gray">
          Already have an account?{' '}
          <Link href="/login" className="text-bnr-teal hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
