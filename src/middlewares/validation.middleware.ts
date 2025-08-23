import { BadRequestError } from "@core/error.classes"
import type { NextFunction, Request, Response } from "express"
import { z } from "zod"

export const validate = (schema: z.ZodSchema, type: "body" | "params" | "query") => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req[type])
      next()
    } catch (error: any) {
      if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => `${err.path.join(".")} ${err.message}`).join(", ");
      next(new BadRequestError("Validation failed.", errors));
      } else {
        next(new BadRequestError("Invalid request data.", error.message))
      }
    }
  }
}
