import env from "@config/env";
import logger from "@config/winston";
import { InternalServerError, NotFoundError } from "@core/error.classes";
import type { UploadApiResponse } from "cloudinary";
import { v2 as cloudinary } from "cloudinary";
import { MulterFile } from "src/types";
import type { IFile } from "../../modules/file/file.interface";
import { FileModel } from "../../modules/file/file.model";
import type { IStorageService } from "./storage.interface";

export class CloudinaryStorageService implements IStorageService {
  constructor() {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      logger.error("Cloudinary environment variables are not fully configured.")
      throw new InternalServerError("Cloudinary configuration missing.")
    }

    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true, // Use HTTPS
    })
    logger.info("Cloudinary Storage Service initialized.")
  }

  async uploadFile(file: MulterFile, userId: string): Promise<IFile> {
    try {
      // Upload buffer directly to Cloudinary
      const result = (await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { resource_type: "auto" }, // auto-detect file type
            (error, result) => {
              if (error) return reject(error)
              if (!result) return reject(new Error("Cloudinary upload returned no result"))
              resolve(result)
            },
          )
          .end(file.buffer)
      })) as UploadApiResponse

      const newFile = await FileModel.create({
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: result.secure_url,
        provider: "CLOUDINARY",
        uploadedBy: userId,
      });
      logger.info(`File uploaded to Cloudinary: ${newFile.filename} (ID: ${newFile._id})`);
      return newFile;
    } catch (error: any) {
      logger.error(`Error uploading file to Cloudinary: ${error.message}`, error)
      throw new InternalServerError("Failed to upload file to Cloudinary.", error.message)
    }
  }

  async getFileStream(fileId: string): Promise<{ stream: NodeJS.ReadableStream; mimeType: string; filename: string }> {
    const fileRecord = await FileModel.findById(fileId);
    if (!fileRecord || fileRecord.provider !== "CLOUDINARY") {
      throw new NotFoundError("File not found or not stored in Cloudinary.");
    }
    try {
      const response = await fetch(fileRecord.url);
      if (!response.ok) {
        throw new InternalServerError(`Failed to fetch file from Cloudinary URL: ${response.statusText}`);
      }
      const stream = response.body as unknown as NodeJS.ReadableStream;
      return { stream, mimeType: fileRecord.mimeType, filename: fileRecord.filename };
    } catch (error: any) {
      logger.error(`Error getting file stream from Cloudinary: ${error.message}`, error);
      throw new InternalServerError("Failed to retrieve file from Cloudinary.", error.message);
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    const fileRecord = await FileModel.findById(fileId);
    if (!fileRecord || fileRecord.provider !== "CLOUDINARY") {
      throw new NotFoundError("File not found or not stored in Cloudinary.");
    }
    try {
      const publicId = fileRecord.url.split("/").pop()?.split(".")[0] ?? "";
      await cloudinary.uploader.destroy(publicId);
      await FileModel.findByIdAndDelete(fileId);
      logger.info(`File deleted from Cloudinary: ${fileRecord.filename} (ID: ${fileRecord._id})`);
    } catch (error: any) {
      logger.error(`Error deleting file from Cloudinary: ${error.message}`, error);
      throw new InternalServerError("Failed to delete file from Cloudinary.", error.message);
    }
  }
}
