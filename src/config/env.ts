import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

interface Env {
  NODE_ENV: string
  PORT: number
  DATABASE_URL: string
  REDIS_HOST: string
  REDIS_PORT: number
  REDIS_USER: string
  REDIS_PASSWORD: string
  JWT_SECRET: string
  JWT_REFRESH_SECRET: string
  ACCESS_TOKEN_EXPIRATION: string
  REFRESH_TOKEN_EXPIRATION: string
  SENTRY_DSN?: string
  SESSION_SECRET: string
  CORS_ORIGIN?: string
  API_KEY_SECRET: string
  STORAGE_TYPE: "LOCAL" | "S3" | "CLOUDINARY"
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  AWS_REGION?: string
  AWS_S3_BUCKET_NAME?: string
  CLOUDINARY_CLOUD_NAME?: string
  CLOUDINARY_API_KEY?: string
  CLOUDINARY_API_SECRET?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GOOGLE_REDIRECT_URI?: string
  // Email Configuration
  EMAIL_HOST?: string
  EMAIL_PORT?: number
  EMAIL_USER?: string
  EMAIL_PASS?: string
  EMAIL_FROM?: string
  EMAIL_FROM_NAME?: string
  EMAIL_SECURE?: boolean
  // Verification Settings
  VERIFICATION_METHOD: "LINK" | "OTP" | "BOTH"
}

const env: Env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number.parseInt(process.env.PORT || "3000", 10),
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/mydatabase?schema=public",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
  REDIS_USER: process.env.REDIS_USER || "default",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  JWT_SECRET: process.env.JWT_SECRET || "supersecretjwtkey",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "supersecretjwtrefreshkey",
  ACCESS_TOKEN_EXPIRATION: process.env.ACCESS_TOKEN_EXPIRATION || "1h",
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION || "7d",
  SENTRY_DSN: process.env.SENTRY_DSN,
  SESSION_SECRET: process.env.SESSION_SECRET || "supersecretsessionkey",
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  API_KEY_SECRET: process.env.API_KEY_SECRET || "supersecretapikey",
  STORAGE_TYPE: (process.env.STORAGE_TYPE as "LOCAL" | "S3" | "CLOUDINARY") || "LOCAL",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  // Email Configuration
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: Number.parseInt(process.env.EMAIL_PORT || "587", 10),
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  EMAIL_SECURE: process.env.EMAIL_SECURE === "true",
  // Verification Settings
  VERIFICATION_METHOD: (process.env.VERIFICATION_METHOD as "LINK" | "OTP" | "BOTH") || "BOTH",
}

// Validate essential environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET", "SESSION_SECRET", "API_KEY_SECRET"]

for (const key of requiredEnvVars) {
  if (!env[key as keyof Env]) {
    console.error(`Missing required environment variable: ${key}`)
    process.exit(1)
  }
}

// Validate storage-specific environment variables
if (env.STORAGE_TYPE === "S3") {
  const s3Required = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "AWS_S3_BUCKET_NAME"]
  for (const key of s3Required) {
    if (!env[key as keyof Env]) {
      console.warn(`Missing S3 environment variable: ${key}. S3 storage may not function correctly.`)
    }
  }
} else if (env.STORAGE_TYPE === "CLOUDINARY") {
  const cloudinaryRequired = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]
  for (const key of cloudinaryRequired) {
    if (!env[key as keyof Env]) {
      console.warn(`Missing Cloudinary environment variable: ${key}. Cloudinary storage may not function correctly.`)
    }
  }
}

export default env

// Export commonly used environment variables as named exports
export const {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  REDIS_HOST,
  REDIS_PORT,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
  SENTRY_DSN,
  SESSION_SECRET,
  CORS_ORIGIN,
  API_KEY_SECRET,
  STORAGE_TYPE,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_S3_BUCKET_NAME,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  // Email Configuration
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  EMAIL_FROM_NAME,
  EMAIL_SECURE,
  // Verification Settings
  VERIFICATION_METHOD,
} = env
