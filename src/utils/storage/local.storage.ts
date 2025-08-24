import logger from "@config/winston";
import { InternalServerError, NotFoundError } from "@core/error.classes";
import fs from "fs";
import path from "path";
import { MulterFile } from "src/types";
import { v4 as uuidv4 } from "uuid";
import type { IFile } from "../../modules/file/file.interface";
import { FileModel } from "../../modules/file/file.model";
import type { IStorageService } from "./storage.interface";

const UPLOADS_DIR = path.join(__dirname, "../../../uploads")

// Check if we're in a serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTIONS_EMULATOR;

// Ensure the uploads directory exists (only in non-serverless environments)
if (!isServerless && !fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
    logger.info(`Created uploads directory at: ${UPLOADS_DIR}`)
  } catch (error) {
    logger.warn(`Could not create uploads directory: ${error}`)
  }
}

export class LocalStorageService implements IStorageService {
  async uploadFile(file: MulterFile, userId: string): Promise<IFile> {
    // In serverless environments, local file storage is not supported
    if (isServerless) {
      throw new InternalServerError("Local file storage is not supported in serverless environments. Please use cloud storage instead.");
    }

    const fileId = uuidv4()
    const filePath = path.join(UPLOADS_DIR, fileId)

    try {
      await fs.promises.writeFile(filePath, file.buffer)

      const newFile = await FileModel.create({
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        url: `/uploads/${fileId}`,
        uploadedBy: userId,
        provider: "LOCAL",
      });
      logger.info(`File uploaded locally: ${newFile.filename} (ID: ${newFile._id})`);
      return newFile;
    } catch (error: any) {
      logger.error(`Error uploading file locally: ${error.message}`, error)
      throw new InternalServerError("Failed to upload file locally.", error.message)
    }
  }

  async getFileStream(fileId: string): Promise<{ stream: NodeJS.ReadableStream; mimeType: string; filename: string }> {
    // In serverless environments, local file storage is not supported
    if (isServerless) {
      throw new InternalServerError("Local file storage is not supported in serverless environments.");
    }

    const fileRecord = await FileModel.findById(fileId);
    if (!fileRecord || fileRecord.provider !== "LOCAL") {
      throw new NotFoundError("File not found or not stored locally.");
    }
    const filePath = fileRecord.path;
    if (!filePath || !fs.existsSync(filePath)) {
      throw new NotFoundError("File not found on disk.");
    }
    const stream = fs.createReadStream(filePath);
    return { stream, mimeType: fileRecord.mimeType, filename: fileRecord.filename };
  }

  async deleteFile(fileId: string): Promise<void> {
    // In serverless environments, local file storage is not supported
    if (isServerless) {
      throw new InternalServerError("Local file storage is not supported in serverless environments.");
    }

    const fileRecord = await FileModel.findById(fileId);
    if (!fileRecord || fileRecord.provider !== "LOCAL") {
      throw new NotFoundError("File not found or not stored locally.");
    }
    const filePath = fileRecord.path;
    try {
      if (filePath && fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        logger.info(`File deleted from local storage: ${fileRecord.filename} (ID: ${fileRecord._id})`);
      } else {
        logger.warn(`Attempted to delete non-existent local file: ${fileRecord.filename} (ID: ${fileRecord._id})`);
      }
      await FileModel.findByIdAndDelete(fileId);
    } catch (error: any) {
      logger.error(`Error deleting file locally: ${error.message}`, error);
      throw new InternalServerError("Failed to delete file locally.", error.message);
    }
  }
}
