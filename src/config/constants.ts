import { Role } from "@prisma/client"

export const PORT = process.env.PORT || 3000
export const NODE_ENV = process.env.NODE_ENV || "development"

export const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_at_least_32_chars"
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your_jwt_refresh_secret_key_at_least_32_chars"
export const ACCESS_TOKEN_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION || "15m"
export const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || "7d"

export const REDIS_HOST = process.env.REDIS_HOST || "localhost"
export const REDIS_PORT = Number.parseInt(process.env.REDIS_PORT || "6379", 10)

export const SENTRY_DSN = process.env.SENTRY_DSN || ""

export const SESSION_SECRET = process.env.SESSION_SECRET || "your_session_secret_key_at_least_32_chars"

export const API_KEY_SECRET = process.env.API_KEY_SECRET || "your_api_key_secret_at_least_32_chars"

export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"]

export const FILE_STORAGE_PROVIDER = process.env.FILE_STORAGE_PROVIDER || "LOCAL" // LOCAL, S3, CLOUDINARY

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || ""
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || ""
export const AWS_REGION = process.env.AWS_REGION || "us-east-1"
export const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || ""

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || ""
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || ""
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || ""

export const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com"
export const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "admin123"

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
}

export const FEATURE_FLAGS = JSON.parse(process.env.FEATURE_FLAGS || "{}")

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.ADMIN]: [
    // User
    "user:read", "user:create", "user:update", "user:delete",
    // Post
    "post:read", "post:create", "post:update", "post:delete", "post:publish",
    // Category, Tag, Series
    "category:manage", "tag:manage", "series:manage",
    // Comment
    "comment:read", "comment:create", "comment:update", "comment:delete", "comment:moderate",
    // File
    "file:upload", "file:read", "file:delete",
    // Contact
    "contact:read", "contact:create", "contact:update", "contact:delete",
    // Newsletter
    "newsletter:read", "newsletter:create", "newsletter:update", "newsletter:delete",
    // Bookmark
    "bookmark:read", "bookmark:create", "bookmark:delete",
    // Like
    "like:read", "like:create", "like:delete",
    // Special
    "admin:full_access",
  ],
  [Role.EDITOR]: [
    "post:read", "post:create", "post:update", "post:delete", "post:publish",
    "category:manage", "tag:manage", "series:manage",
    "comment:read", "comment:update", "comment:delete", "comment:moderate",
    "file:upload", "file:read", "file:delete",
    "contact:read", "contact:update",
    "newsletter:read", "newsletter:update",
    "bookmark:read", "bookmark:create", "bookmark:delete",
    "like:read", "like:create", "like:delete",
  ],
  [Role.AUTHOR]: [
    "post:read", "post:create", "post:update",
    "file:upload", "file:read",
    "comment:create",
    "bookmark:read", "bookmark:create", "bookmark:delete",
    "like:read", "like:create", "like:delete",
    "newsletter:read",
  ],
  [Role.USER]: [
    "post:read", "file:read", "comment:create",
    "bookmark:read", "bookmark:create", "bookmark:delete",
    "like:read", "like:create", "like:delete",
    "newsletter:read",
  ],
}

export const PERMISSIONS = {
  FILE_UPLOAD: "file:upload",
  FILE_READ: "file:read",
  FILE_DELETE: "file:delete",
}
