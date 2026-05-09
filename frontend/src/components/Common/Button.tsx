'use client';
import React from 'react';
import { ButtonProps, ButtonVariant } from '@/types/components';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-bnr-teal hover:bg-bnr-cyan text-white',
  secondary: 'bg-bnr-blue hover:bg-bnr-cyan text-white',
  danger: 'bg-red-600 hover:bg-bnr-cyan text-white',
  ghost: 'bg-transparent border border-bnr-teal text-bnr-teal hover:bg-bnr-cyan hover:text-white',
};

export const Button = ({
  variant = 'primary',
  loading,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
  >
    {loading && (
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    )}
    {children}
  </button>
);
