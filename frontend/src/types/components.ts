import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Application } from './application';
import type { Document } from './document';

export interface ApplicationCardProps {
  application: Application;
}

export interface StateTransitionButtonProps {
  application: Application;
}

export interface DocumentListProps {
  documents: Document[];
  applicationId: number;
}

export type FeedbackVariant = 'warning' | 'success' | 'danger';

export interface FeedbackDisplayProps {
  feedback: string | null;
  label?: string;
  variant?: FeedbackVariant;
}

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export interface LoadingSpinnerProps {
  label?: string;
}
