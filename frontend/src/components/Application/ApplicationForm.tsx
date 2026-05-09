'use client';
import { useForm } from 'react-hook-form';
import { useCreateApplication } from '@/hooks/useApplications';
import { Button } from '@/components/Common/Button';
import { ErrorAlert } from '@/components/Common/ErrorAlert';
import { ApiError } from '@/types';
import { ApplicationFormValues } from '@/types/forms';

export const ApplicationForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ApplicationFormValues>();
  const mutation = useCreateApplication();

  const onSubmit = (values: ApplicationFormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        reset(); // clear form after submit so they can create another one
        onSuccess?.();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {mutation.isError && (
        <ErrorAlert message={(mutation.error as ApiError)?.message || 'Failed to create application'} />
      )}
      <div>
        <label className="block text-sm font-medium text-bnr-gray mb-1">
          Institution Name
        </label>
        <input
          {...register('institution_name', { required: 'Institution name is required' })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bnr-teal"
          placeholder="e.g. First National Bank of Rwanda"
        />
        {errors.institution_name && (
          <p className="text-xs text-red-500 mt-1">{errors.institution_name.message}</p>
        )}
      </div>
      <Button type="submit" loading={mutation.isPending}>
        Submit Application
      </Button>
    </form>
  );
};
