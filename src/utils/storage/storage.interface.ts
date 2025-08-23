
// Replace File with your Mongoose FileDocument type when available
type File = any;

export interface IStorageService {
  uploadFile(file: Express.Multer.File, userId: string): Promise<File>
  getFileStream(fileId: string): Promise<{ stream: NodeJS.ReadableStream; mimeType: string; filename: string }>
  deleteFile(fileId: string): Promise<void>
}
