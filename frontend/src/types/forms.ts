export interface LoginFormValues {
  email: string;
  password: string;
}

// role kept as string — react-hook-form returns select values as strings at runtime
export interface SignupFormValues {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

export interface ApplicationFormValues {
  institution_name: string;
}
