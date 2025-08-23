import { HTTP_STATUS } from '@config/constants';
import type { Response } from 'express';

export type TError = {
  code: number;
  message: string;
  path: string;
  timestamp: string;
  stack?: string;
};

export type TMeta = {
  limit: number;
  page: number;
  total: number;
  totalPage: number;
};

export type TResponse<T> = {
  data?: T;
  error?: TError;
  meta?: TMeta;
  success: boolean;
  message: string;
  statusCode?: number;
};

function buildMeta(pagination?: any): TMeta | undefined {
  if (!pagination) return undefined;
  return {
    limit: pagination.itemsPerPage || pagination.limit || 10,
    page: pagination.currentPage || pagination.page || 1,
    total: pagination.totalItems || pagination.total || 0,
    totalPage: pagination.totalPages || pagination.totalPage || 1,
  };
}

export function successResponse<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = HTTP_STATUS.OK,
  meta?: TMeta,
) {
  const response: TResponse<T> = {
    data,
    meta,
    success: true,
    message,
    statusCode,
  };
  res.status(statusCode).json(response);
}

export function paginatedResponse<T>(
  res: Response,
  message: string,
  paginatedData: any,
  statusCode: number = HTTP_STATUS.OK,
) {
  const meta = buildMeta(paginatedData.pagination);
  const response: TResponse<T[]> = {
    data: paginatedData.data,
    meta,
    success: true,
    message,
    statusCode,
  };
  res.status(statusCode).json(response);
}

export function errorResponse(
  res: Response,
  message: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errorMessage?: { path: string; message: string },
  stack?: string,
) {
  const response: TResponse<null> = {
    success: false,
    message,
    statusCode: status,
    error: {
      code: status,
      message,
      path: errorMessage?.path || '',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: stack || '' }),
    },
  };
  res.status(status).json(response);
}

export function validationErrorResponse(
  res: Response,
  errors: { path: string; message: string }[],
  message: string = 'Validation failed',
  status: number = HTTP_STATUS.BAD_REQUEST,
) {
  const response: TResponse<null> = {
    success: false,
    message,
    statusCode: status,
    error: {
      code: status,
      message,
      path: errors[0]?.path || '',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: '' }),
    },
  };
  res.status(status).json(response);
}

export function notFoundResponse(
  res: Response,
  resource: string,
  id?: string,
  status: number = HTTP_STATUS.NOT_FOUND,
) {
  const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
  const response: TResponse<null> = {
    success: false,
    message,
    statusCode: status,
    error: {
      code: status,
      message,
      path: resource,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: '' }),
    },
  };
  res.status(status).json(response);
}

export function unauthorizedResponse(
  res: Response,
  message: string = 'Unauthorized access',
  status: number = HTTP_STATUS.UNAUTHORIZED,
) {
  const response: TResponse<null> = {
    success: false,
    message,
    statusCode: status,
    error: {
      code: status,
      message,
      path: '',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: '' }),
    },
  };
  res.status(status).json(response);
}

export function forbiddenResponse(
  res: Response,
  message: string = 'Access forbidden',
  status: number = HTTP_STATUS.FORBIDDEN,
) {
  const response: TResponse<null> = {
    success: false,
    message,
    statusCode: status,
    error: {
      code: status,
      message,
      path: '',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: '' }),
    },
  };
  res.status(status).json(response);
}

export function conflictResponse(
  res: Response,
  message: string = 'Resource conflict',
  status: number = HTTP_STATUS.CONFLICT,
) {
  const response: TResponse<null> = {
    success: false,
    message,
    statusCode: status,
    error: {
      code: status,
      message,
      path: '',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: '' }),
    },
  };
  res.status(status).json(response);
}

export function rateLimitResponse(
  res: Response,
  message: string = 'Too many requests',
  retryAfter?: number,
  status: number = HTTP_STATUS.TOO_MANY_REQUESTS,
) {
  const response: TResponse<null> = {
    success: false,
    message,
    statusCode: status,
    error: {
      code: status,
      message,
      path: '',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: '' }),
    },
  };
  res.status(status).json(response);
}
