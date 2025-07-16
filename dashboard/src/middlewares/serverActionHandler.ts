import { UserException } from '@/lib/exceptions';
import { unstable_rethrow } from 'next/navigation';

/**
 * Type for the response from a wrapped server action
 */
export type ServerActionResponse<T = unknown> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        message: string;
        name: string;
        [key: string]: unknown;
      };
    };

type ServerActionHandlers = Record<string, (...args: any) => Promise<any>>;

type WrappedServerActions<T extends ServerActionHandlers> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promise<ServerActionResponse<Awaited<ReturnType<T[K]>>>>;
};

/**
 * Wraps a server action with consistent error handling
 *
 * @param handler The server action function to wrap
 * @returns A wrapped function that returns a consistent response format
 *
 * @example
 * export const myAction = withServerAction(async (data: unknown) => {
 *   return true;
 * });
 */
export function withServerAction<T, Args extends unknown[]>(handler: (...args: Args) => Promise<T>) {
  return async (...args: Args): Promise<ServerActionResponse<T>> => {
    try {
      const result = await handler(...args);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // Required to rethrow internal nextjs errors
      // https://nextjs.org/docs/app/api-reference/functions/unstable_rethrow
      unstable_rethrow(error);

      console.error('Server action error:', error);

      if (isUserException(error)) {
        return {
          success: false,
          error: {
            message: error.message,
            name: error.name,
          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred. Please try again later.',
          name: 'ServerError',
        },
      };
    }
  };
}

function isUserException(error: unknown): error is UserException {
  return error instanceof UserException;
}
