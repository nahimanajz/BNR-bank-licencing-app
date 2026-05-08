export const LoadingSpinner = ({ label = 'Loading...' }: { label?: string }) => (
  <div className="flex items-center justify-center py-16">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-bnr-teal border-t-transparent" />
    <span className="ml-3 text-bnr-gray">{label}</span>
  </div>
);
