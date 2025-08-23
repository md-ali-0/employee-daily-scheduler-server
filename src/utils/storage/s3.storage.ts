import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
// import mongoose connection if needed for future file model
import env from "@config/env"
import logger from "@config/winston"
import { InternalServerError, NotFoundError } from "@core/error.classes"
import type { IStorageService } from "./storage.interface"
// Replace File with your Mongoose FileDocument type when available
type File = any;

export class S3StorageService implements IStorageService {
  private s3Client: S3Client
  private bucketName: string

  constructor() {
    if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_REGION || !env.AWS_S3_BUCKET_NAME) {
      logger.error("AWS S3 environment variables are not fully configured.")
      throw new InternalServerError("AWS S3 configuration missing.")
    }

    this.s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    })
    this.bucketName = env.AWS_S3_BUCKET_NAME
    logger.info(`S3 Storage Service initialized for bucket: ${this.bucketName}`)
  }

  async uploadFile(file: Express.Multer.File, userId: string): Promise<File> {
    const fileKey = `${Date.now()}-${file.originalname}` // Unique key for S3
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    })

    try {
      await this.s3Client.send(command)
      const fileUrl = `https://${this.bucketName}.s3.${env.AWS_REGION}.amazonaws.com/${fileKey}`

  // TODO: Save file metadata using Mongoose File model
  const newFile = {} as File; // Replace with actual Mongoose save logic
  logger.info(`File uploaded to S3: ${file.originalname}`)
  return newFile;
    } catch (error: any) {
      logger.error(`Error uploading file to S3: ${error.message}`, error)
      throw new InternalServerError("Failed to upload file to S3.", error.message)
    }
  }

  async getFileStream(fileId: string): Promise<{ stream: NodeJS.ReadableStream; mimeType: string; filename: string }> {
  // TODO: Fetch file metadata using Mongoose File model
  const fileRecord = {} as File; // Replace with actual Mongoose find logic
    if (!fileRecord || fileRecord.provider !== "S3") {
      throw new NotFoundError("File not found or not stored in S3.")
    }

    if (!fileRecord.path) {
      throw new NotFoundError("File path is missing for the requested file.");
    }
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileRecord.path, // S3 key is stored in 'path'
    })

    try {
      const { Body, ContentType } = await this.s3Client.send(command)
      if (!Body) {
        throw new NotFoundError("File content not found in S3.")
      }
      return {
        stream: Body as NodeJS.ReadableStream,
        mimeType: ContentType || fileRecord.mimeType,
        filename: fileRecord.filename,
      }
    } catch (error: any) {
      logger.error(`Error getting file from S3: ${error.message}`, error)
      if (error.name === "NoSuchKey") {
        throw new NotFoundError("File not found in S3 bucket.")
      }
      throw new InternalServerError("Failed to retrieve file from S3.", error.message)
    }
  }

  async deleteFile(fileId: string): Promise<void> {
  // TODO: Fetch file metadata using Mongoose File model
  const fileRecord = {} as File; // Replace with actual Mongoose find logic
    if (!fileRecord || fileRecord.provider !== "S3") {
      throw new NotFoundError("File not found or not stored in S3.")
    }

    if (!fileRecord.path) {
      throw new NotFoundError("File path is missing for the requested file.");
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileRecord.path, // S3 key is stored in 'path'
    })

    try {
      await this.s3Client.send(command)
  // TODO: Delete file metadata using Mongoose File model
      logger.info(`File deleted from S3: ${fileRecord.filename} (ID: ${fileRecord.id})`)
    } catch (error: any) {
      logger.error(`Error deleting file from S3: ${error.message}`, error)
      throw new InternalServerError("Failed to delete file from S3.", error.message)
    }
  }

  /**
   * Generates a pre-signed URL for a file in S3.
   * Useful for private files that need temporary access.
   * @param fileId The ID of the file record.
   * @param expiresIn The expiration time in seconds (default 3600s = 1 hour).
   * @returns A promise that resolves to the signed URL.
   */
  async getSignedUrl(fileId: string, expiresIn = 3600): Promise<string> {
  // TODO: Fetch file metadata using Mongoose File model
  const fileRecord = {} as File; // Replace with actual Mongoose find logic
    if (!fileRecord || fileRecord.provider !== "S3") {
      throw new NotFoundError("File not found or not stored in S3.")
    }

    
    if (!fileRecord.path) {
      throw new NotFoundError("File path is missing for the requested file.");
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileRecord.path,
    })

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn })
      return signedUrl
    } catch (error: any) {
      logger.error(`Error generating signed URL for file ${fileId}: ${error.message}`, error)
      throw new InternalServerError("Failed to generate signed URL.", error.message)
    }
  }
}
