import { FeedbackDisplayProps } from '@/types/components';
import { BODY_STYLES, LABEL_STYLES, VARIANT_STYLES } from '@/utils/constants';

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
