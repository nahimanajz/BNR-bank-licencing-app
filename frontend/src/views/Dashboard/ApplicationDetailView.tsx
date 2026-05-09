'use client';
import Link from 'next/link';
import { useApplication } from '@/hooks/useApplications';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { StateTransitionButton } from '@/components/Application/StateTransitionButton';
import { DocumentList } from '@/components/Documents/DocumentList';
import { DocumentUpload } from '@/components/Documents/DocumentUpload';
import { FeedbackDisplay } from '@/components/Feedback/FeedbackDisplay';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';
import { ErrorAlert } from '@/components/Common/ErrorAlert';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';
import { ApiError, UserRole, ApplicationStatus } from '@/types';

export const ApplicationDetailView = ({ id }: { id: number }) => {
  const { user } = useAuth();
  const { data: app, isLoading, isError, error } = useApplication(id);
  const { data: documents = [] } = useDocuments(id);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !app) return <ErrorAlert message={(error as ApiError)?.message || 'Application not found'} />;

  const canUpload =
    user?.role === UserRole.APPLICANT &&
    app.applicant_id === user.id &&
    [ApplicationStatus.DRAFT, ApplicationStatus.CLARIFICATION_REQUESTED].includes(app.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/applications" className="hover:text-bnr-teal">Applications</Link>
        <span>/</span>
        <span className="text-bnr-dark font-medium">{app.institution_name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-bnr-dark">{app.institution_name}</h1>
            <p className="text-sm text-gray-400 mt-1">Application #{app.id}</p>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>
            {STATUS_LABELS[app.status]}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-bnr-gray">
          <div><span className="font-medium">Created:</span> {formatDate(app.createdAt)}</div>
          <div><span className="font-medium">Updated:</span> {formatDate(app.updatedAt)}</div>
          <div><span className="font-medium">Version:</span> {app.version}</div>
        </div>
      </div>

      {/* Reviewer feedback — shown when clarification was requested */}
      {app.reviewer_feedback && (
        <FeedbackDisplay
          feedback={app.reviewer_feedback}
          label="Reviewer Feedback"
          variant="warning"
        />
      )}

      {/* Decision notes — colour-coded by outcome */}
      {app.decision_notes && (
        <FeedbackDisplay
          feedback={app.decision_notes}
          label="Decision Notes"
          variant={app.status === ApplicationStatus.APPROVED ? 'success' : 'danger'}
        />
      )}

      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-bnr-dark mb-4">Actions</h2>
        <StateTransitionButton application={app} />
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-bnr-dark mb-4">Documents</h2>
        {canUpload && (
          <div className="mb-4">
            <DocumentUpload applicationId={id} />
          </div>
        )}
        <DocumentList documents={documents} applicationId={id} />
      </div>
    </div>
  );
};
