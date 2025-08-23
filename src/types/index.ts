export * from "./jwt-signin-options";
export * from "./multer";

import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: Role
        permissions: string[]
      }
    }
  }
}

