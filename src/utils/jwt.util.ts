import { UnauthorizedError } from "@core/error.classes"
import i18n from "@config/i18n-compat"
import jwt, { SignOptions } from "jsonwebtoken"
import { StringValue } from "src/types"

interface TokenPayload {
  id: string
  email: string
  role: string
  permissions: string[]
}

/**
 * Generates a JWT token.
 */
export const generateToken = (
  payload: TokenPayload,
  secret: string,
  expiresIn: string
): string => {
  const options: SignOptions = { expiresIn : expiresIn as StringValue } // Ensure expiresIn is of type StringValue
  return jwt.sign(payload, secret, options)
}

/**
 * Verifies a JWT token.
 */
export const verifyToken = (token: string, secret: string): TokenPayload => {
  try {
    return jwt.verify(token, secret) as TokenPayload
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError(i18n.__("errors.token_expired"), "auth.token_expired")
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError(i18n.__("errors.token_invalid"), "auth.token_invalid")
    }
    throw new UnauthorizedError(i18n.__("errors.token_verification_failed"), "auth.token_verification_failed")
  }
}
