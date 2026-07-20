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
 * Webhook processing failure that no Stripe retry can fix (missing metadata,
 * config drift, orphaned subscription). The webhook route acks these with 200
 * instead of letting Stripe retry for 3 days.
 */
export class NonRetryableWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableWebhookError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NonRetryableWebhookError);
    }
  }
}

/**
 * UserException is a special exception type that indicates an error message
 * that is safe to show to the end user. All other exceptions should be
 * considered internal and not exposed directly to users.
 */
export class UserException extends Error {
  // Stable identifier the UI can use to render a localized message
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'UserException';
    this.code = code;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserException);
    }
  }
}
