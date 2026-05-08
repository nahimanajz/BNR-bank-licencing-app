export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) { super(message, 400); }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Unauthorized') { super(message, 401); }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Forbidden') { super(message, 403); }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') { super(message, 404); }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') { super(message, 409); }
}

export class InvalidTransitionError extends AppError {
  constructor(message: string) { super(message, 400); }
}
