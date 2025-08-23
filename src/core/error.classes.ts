import { HTTP_STATUS } from '@config/constants';

/**
 * Base custom error class for API errors.
 * All custom errors should extend this class.
 */
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  // ✅ Allow string OR string[] for validation errors
  public translationKey?: string | string[];

  public translationParams?: Record<string, any>;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    translationKey?: string | string[],
    translationParams?: Record<string, any>,
    stack = '',
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.translationKey = translationKey;
    this.translationParams = translationParams;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error for invalid input or bad requests (HTTP 400).
 */
export class BadRequestError extends ApiError {
  constructor(
    message = 'Bad Request',
    translationKey?: string | string[],
    translationParams?: Record<string, any>,
  ) {
    super(HTTP_STATUS.BAD_REQUEST, message, true, translationKey, translationParams);
  }
}

/**
 * Error for authentication failures (HTTP 401).
 */
export class UnauthorizedError extends ApiError {
  constructor(
    message = 'Unauthorized',
    translationKey?: string | string[],
    translationParams?: Record<string, any>,
  ) {
    super(HTTP_STATUS.UNAUTHORIZED, message, true, translationKey, translationParams);
  }
}

/**
 * Error for authorization failures (HTTP 403).
 */
export class ForbiddenError extends ApiError {
  constructor(
    message = 'Forbidden',
    translationKey?: string | string[],
    translationParams?: Record<string, any>,
  ) {
    super(HTTP_STATUS.FORBIDDEN, message, true, translationKey, translationParams);
  }
}

/**
 * Error for resource not found (HTTP 404).
 */
export class NotFoundError extends ApiError {
  constructor(
    message = 'Not Found',
    translationKey?: string | string[],
    translationParams?: Record<string, any>,
  ) {
    super(HTTP_STATUS.NOT_FOUND, message, true, translationKey, translationParams);
  }
}

/**
 * Error for conflicts, e.g., duplicate resource (HTTP 409).
 */
export class ConflictError extends ApiError {
  constructor(
    message = 'Conflict',
    translationKey?: string | string[],
    translationParams?: Record<string, any>,
  ) {
    super(HTTP_STATUS.CONFLICT, message, true, translationKey, translationParams);
  }
}

/**
 * Error for unprocessable entity, e.g., validation errors (HTTP 422).
 */
export class UnprocessableEntityError extends ApiError {
  constructor(
    message = 'Unprocessable Entity',
    translationKey?: string | string[],
    translationParams?: Record<string, any>,
  ) {
    super(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, true, translationKey, translationParams);
  }
}

/**
 * Error for too many requests (HTTP 429).
 */
export class TooManyRequestsError extends ApiError {
  constructor(
    message = 'Too Many Requests',
    translationKey?: string | string[],
    translationParams?: Record<string, any>,
  ) {
    super(HTTP_STATUS.TOO_MANY_REQUESTS, message, true, translationKey, translationParams);
  }
}

/**
 * Error for internal server errors (HTTP 500).
 */
export class InternalServerError extends ApiError {
  constructor(
    message = 'Internal Server Error',
    translationKey?: string | string[],
    translationParams?: Record<string, any>,
  ) {
    super(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, false, translationKey, translationParams);
  }
}
