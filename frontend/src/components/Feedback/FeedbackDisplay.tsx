import { FeedbackDisplayProps, FeedbackVariant } from '@/types/components';

const VARIANT_STYLES: Record<FeedbackVariant, string> = {
  warning: 'bg-amber-50 border-amber-200',
  success: 'bg-green-50 border-green-200',
  danger: 'bg-red-50 border-red-200',
};

const LABEL_STYLES: Record<FeedbackVariant, string> = {
  warning: 'text-amber-700',
  success: 'text-green-700',
  danger: 'text-red-700',
};

const BODY_STYLES: Record<FeedbackVariant, string> = {
  warning: 'text-amber-800',
  success: 'text-green-800',
  danger: 'text-red-800',
};

export const FeedbackDisplay = ({
  feedback,
  label = 'Reviewer Feedback',
  variant = 'warning',
}: FeedbackDisplayProps) => {
  if (!feedback) return null;
  return (
    <div className={`rounded-md border px-4 py-3 ${VARIANT_STYLES[variant]}`}>
      <p className={`text-xs font-semibold mb-1 ${LABEL_STYLES[variant]}`}>{label}</p>
      <p className={`text-sm whitespace-pre-wrap ${BODY_STYLES[variant]}`}>{feedback}</p>
    </div>
  );
};
