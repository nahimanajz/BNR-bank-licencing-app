import type { ApplicationStatus, DecisionValue } from './application';

export enum TransitionHandler {
  TRANSITION = 'transition',
  FEEDBACK = 'feedback',
  DECIDE = 'decide',
}

export interface TransitionAction {
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  handler: TransitionHandler;
  requiresTextarea: boolean;
  textareaPlaceholder?: string;
  decideValue?: DecisionValue;
}

export type TransitionMap = Partial<Record<ApplicationStatus, TransitionAction>>;
