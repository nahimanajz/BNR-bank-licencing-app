interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorAlert = ({ message, onDismiss }: ErrorAlertProps) => (
  <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
    <span className="flex-1">{message}</span>
    {onDismiss && (
      <button onClick={onDismiss} className="text-red-500 hover:text-red-700 font-bold leading-none">
        ×
      </button>
    )}
  </div>
);
