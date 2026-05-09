'use client';
import { useState } from 'react';
import { useApplications } from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';
import { ApplicationCard } from '@/components/Application/ApplicationCard';
import { ApplicationForm } from '@/components/Application/ApplicationForm';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';
import { ErrorAlert } from '@/components/Common/ErrorAlert';
import { EmptyState } from '@/components/Common/EmptyState';
import { Button } from '@/components/Common/Button';
import { ApiError, UserRole } from '@/types';

// TODO: add pagination when the list grows beyond a single page

export const ApplicationsListView = () => {
  const { user } = useAuth();
  const { data: applications, isLoading, isError, error } = useApplications();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorAlert message={(error as ApiError)?.message || 'Failed to load applications'} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-bnr-dark">Applications</h1>
        {user?.role === UserRole.APPLICANT && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Application'}
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-bnr-dark mb-4">New Application</h2>
          <ApplicationForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {!applications || applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description={
            user?.role === UserRole.APPLICANT
              ? 'Create your first application to get started.'
              : 'No applications found.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  );
};
