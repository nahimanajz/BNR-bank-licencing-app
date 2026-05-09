import { EmptyStateProps } from '@/types/components';

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-4xl mb-4">📄</div>
    <h3 className="text-lg font-semibold text-bnr-dark">{title}</h3>
    {description && <p className="mt-1 text-sm text-bnr-gray">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
