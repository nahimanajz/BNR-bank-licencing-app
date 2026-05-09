'use client';
import { useState } from 'react';
import { ApplicationStatus, UserRole, ApiError } from '@/types';
import { StateTransitionButtonProps } from '@/types/components';
import { TransitionHandler } from '@/types/state-machine';
import { useAuth } from '@/hooks/useAuth';
import {
  useTransitionApplication,
  useProvideFeedback,
  useDecideApplication,
} from '@/hooks/useApplications';
import { Button } from '@/components/Common/Button';
import { ErrorAlert } from '@/components/Common/ErrorAlert';
import { getNextStates, TRANSITION_ACTIONS } from '@/utils/stateMachine';

export const StateTransitionButton = ({ application }: StateTransitionButtonProps) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const transitionMutation = useTransitionApplication();
  const feedbackMutation = useProvideFeedback();
  const decideMutation = useDecideApplication();

  if (!user) return null;

  const allNextStates = getNextStates(application.status, user.role);

  // if the same person reviewed it, they can't approve it too - backend will reject anyway
  // but we hide the button so the user doesn't get confused by a 403 error
  const isConflictedApprover =
    user.role === UserRole.APPROVER && application.current_reviewer_id === user.id;

  const nextStates = isConflictedApprover
    ? allNextStates.filter((s) => s !== ApplicationStatus.APPROVED && s !== ApplicationStatus.REJECTED)
    : allNextStates;

  if (allNextStates.length === 0) return null;

  if (isConflictedApprover && nextStates.length === 0) {
    return (
      <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        <span className="font-medium">Conflict of interest — </span>
        you reviewed this application and cannot make the final approval decision. Another approver must decide.
      </div>
    );
  }

  const needsTextarea = nextStates.some((s) => TRANSITION_ACTIONS[s]?.requiresTextarea);
  const textareaPlaceholder =
    nextStates
      .map((s) => TRANSITION_ACTIONS[s]?.textareaPlaceholder)
      .find(Boolean) ?? 'Notes...';

  const isPending =
    transitionMutation.isPending || feedbackMutation.isPending || decideMutation.isPending;

  const handleClick = (targetStatus: ApplicationStatus) => {
    const action = TRANSITION_ACTIONS[targetStatus];
    if (!action) return;

    if (action.requiresTextarea && !text.trim()) {
      setError(
        action.handler === TransitionHandler.FEEDBACK
          ? 'Feedback is required'
          : 'Notes are required'
      );
      return;
    }

    setError(null);

    if (action.handler === TransitionHandler.FEEDBACK) {
      feedbackMutation.mutate(
        { id: application.id, feedback: text, version: application.version },
        { onError: (err) => setError((err as ApiError).message || 'Action failed') }
      );
    } else if (action.handler === TransitionHandler.DECIDE) {
      decideMutation.mutate(
        {
          id: application.id,
          decision: action.decideValue!,
          notes: text,
          version: application.version,
        },
        { onError: (err) => setError((err as ApiError).message || 'Decision failed') }
      );
    } else {
      transitionMutation.mutate(
        { id: application.id, newStatus: targetStatus, version: application.version },
        { onError: (err) => setError((err as ApiError).message || 'Transition failed') }
      );
    }
  };

  return (
    <div className="space-y-3">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {needsTextarea && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={textareaPlaceholder}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bnr-teal"
        />
      )}

      <div className="flex gap-2 flex-wrap">
        {nextStates.map((targetStatus) => {
          const action = TRANSITION_ACTIONS[targetStatus];
          if (!action) return null;
          return (
            <Button
              key={targetStatus}
              variant={action.variant}
              onClick={() => handleClick(targetStatus)}
              loading={isPending}
            >
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
