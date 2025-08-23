import { BadRequestError } from "@core/error.classes"
import multer from "multer"

// Configure multer for in-memory storage
const storage = multer.memoryStorage()

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images and PDFs
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true)
  } else {
    cb(new BadRequestError("Invalid file type. Only images and PDFs are allowed."))
  }
}

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB file size limit
  },
  fileFilter: fileFilter,
})
