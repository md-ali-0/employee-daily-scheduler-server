import { authenticate } from '@middlewares/auth.middleware';
import { upload } from '@middlewares/multer.middleware';
import { Router } from 'express';
import { FileController } from './file.controller';
import { fileIdSchema } from './file.validation';

export class FileRoutes {
  public router: Router;
  private fileController: FileController;

  constructor() {
    this.router = Router();
    this.fileController = new FileController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      '/',
      authenticate,
      this.fileController.getAll,
    );
    this.router.post(
      '/upload',
      authenticate,
      upload.single('file'), // 'file' is the field name for the uploaded file
      this.fileController.uploadFile,
    );
    this.router.get(
      '/:id',
      authenticate, // Or make public if files are meant to be public
      this.fileController.validate(fileIdSchema, 'params'),
      this.fileController.getFileById,
    );
    this.router.get(
      '/:id/download',
      authenticate, // Or make public
      this.fileController.validate(fileIdSchema, 'params'),
      this.fileController.downloadFile,
    );
    this.router.delete(
      '/:id',
      authenticate,
      this.fileController.validate(fileIdSchema, 'params'),
      this.fileController.deleteFile,
    );
  }
}
