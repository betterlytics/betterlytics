export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ForbiddenError);
    }
  }
}

/**
 * UserException is a special exception type that indicates an error message
 * that is safe to show to the end user. All other exceptions should be
 * considered internal and not exposed directly to users.
 */
export class UserException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserException';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserException);
    }
  }
}