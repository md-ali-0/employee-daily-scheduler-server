import { HTTP_STATUS, NODE_ENV } from "@config/constants"
import i18n from "@config/i18n-compat"
import Sentry from "@config/sentry"
import logger from "@config/winston"
import { ApiError, InternalServerError } from "@core/error.classes"
import { errorResponse, validationErrorResponse } from "@core/response.util"
// import mongoose error types as needed
import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"

/**
 * Global error handling middleware.
 * Catches all errors, logs them, and sends appropriate responses.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err

  // If it's not an operational error, convert it to a generic InternalServerError
  if (!(error instanceof ApiError)) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const errors = error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }))
      error = new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        i18n.__("errors.validation_failed"),
        true,
        "errors.validation_failed",
        { errors },
      )
      // Attach validation errors to the error object for detailed response
      error.details = errors
    }
    // Handle Mongoose/MongoDB errors
    if (error.name === "MongoServerError" && error.code === 11000) {
      // Duplicate key error
      const target = Object.keys(error.keyValue).join(", ") || "unique field";
      error = new ApiError(
        HTTP_STATUS.CONFLICT,
        i18n.__("errors.duplicate_entry", { target }),
        true,
        "errors.duplicate_entry",
        { target },
      );
    } else if (error.name === "DocumentNotFoundError") {
      error = new ApiError(HTTP_STATUS.NOT_FOUND, i18n.__("errors.record_not_found"), true, "errors.record_not_found");
    } else if (error.name === "ValidationError") {
      error = new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        i18n.__("errors.validation_failed"),
        true,
        "errors.validation_failed",
        { errors: error.errors },
      );
    }
    // Handle other unexpected errors
    else {
      error = new InternalServerError(
        error.message || i18n.__("errors.internal_server_error"),
        "errors.internal_server_error",
      )
    }
  }

  // Log the error
  if (error.isOperational) {
    logger.warn(`Operational Error: ${error.message}`, {
      statusCode: error.statusCode,
      path: req.path,
      method: req.method,
      stack: error.stack,
    })
  } else {
    logger.error(`Non-Operational Error: ${error.message}`, {
      statusCode: error.statusCode,
      path: req.path,
      method: req.method,
      stack: error.stack,
    })
    // Send to Sentry for non-operational errors in production
    if (NODE_ENV === "production") {
      Sentry.captureException(error)
    }
  }

  // Send error response
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
  const message = error.translationKey ? i18n.__(error.translationKey, error.translationParams) : error.message

  // For validation errors, include details if available
  if (error.details && statusCode === HTTP_STATUS.BAD_REQUEST) {
    return validationErrorResponse(res, error.details, message, statusCode)
  }

  errorResponse(res, message, statusCode, { path: req.path, message }, error.stack)
}
