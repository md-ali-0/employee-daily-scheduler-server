import { JWT_SECRET } from "@config/constants";
import logger from "@config/winston";
import { ForbiddenError, UnauthorizedError } from "@core/error.classes";
import { Role } from "@modules/user/user.interface";
import { UserModel } from "@modules/user/user.model";
import { verifyToken } from "@utils/jwt.util";
import type { NextFunction, Request, Response } from "express";

// Mongoose User model is now imported

/**
 * Middleware to authenticate requests using JWT.
 * Attaches user information to `req.user` if authentication is successful.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First try to get token from Authorization header (for API clients)
    let token = null
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
    }
    
    // If no Authorization header, try to get token from cookies (for web clients)
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken
    }
    
    if (!token) {
      throw new UnauthorizedError("Authentication token missing", "auth.token_missing")
    }

    const decoded = verifyToken(token, JWT_SECRET)

    if (!decoded || typeof decoded.id !== "string") {
      throw new UnauthorizedError("Invalid authentication token", "auth.invalid_token")
    }

  // Fetch user using Mongoose User model and populate permissions
  const user = await UserModel.findById(decoded.id).lean();

    if (!user || user.deletedAt) {
      throw new UnauthorizedError("User not found or account deactivated", "auth.user_not_found_or_deactivated")
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next()
  } catch (error: any) {
    logger.warn(`Authentication failed: ${error.message}`)
    next(error)
  }
}

/**
 * Middleware to authorize requests based on user roles.
 * @param allowedRoles - An array of roles that are allowed to access the route.
 */
export const authorizeRoles = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // This should ideally not happen if `authenticate` middleware runs before this.
      // But as a safeguard, if user is not attached, it means unauthorized.
      return next(new UnauthorizedError("User not authenticated", "auth.user_not_authenticated"))
    }

    if (!allowedRoles.includes((req.user as any).role)) {
      return next(new ForbiddenError("Insufficient role permissions", "auth.insufficient_role_permissions"))
    }
    next()
  }
}

/**
 * Middleware to authorize requests based on specific permissions.
 * @param requiredPermissions - An array of permission strings required to access the route.
 */
export const authorizePermissions = (requiredPermissions: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("User not authenticated", "auth.user_not_authenticated"))
    }

    const userPermissions = (req.user as any).permissions || []
    const permissionsArray = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]

    const hasPermission = permissionsArray.some((permission) => userPermissions.includes(permission))

    if (!hasPermission) {
      return next(new ForbiddenError("Insufficient permissions", "auth.insufficient_permissions"))
    }
    next()
  }
}
