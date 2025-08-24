import { Role } from "@modules/user/user.interface";

export * from "./jwt-signin-options";
export * from "./multer";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: Role
      }
    }
  }
}

