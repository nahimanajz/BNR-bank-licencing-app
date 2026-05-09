import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export interface LoadingSpinnerProps {
  label?: string;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}
