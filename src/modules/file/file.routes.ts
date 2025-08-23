import { PERMISSIONS } from '@config/constants';
import { authenticate, authorizePermissions } from '@middlewares/auth.middleware';
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
      authorizePermissions(PERMISSIONS.FILE_READ),
      this.fileController.getAll,
    );
    this.router.post(
      '/upload',
      authenticate,
      authorizePermissions(PERMISSIONS.FILE_UPLOAD),
      upload.single('file'), // 'file' is the field name for the uploaded file
      this.fileController.uploadFile,
    );
    this.router.get(
      '/:id',
      authenticate, // Or make public if files are meant to be public
      authorizePermissions(PERMISSIONS.FILE_READ),
      this.fileController.validate(fileIdSchema, 'params'),
      this.fileController.getFileById,
    );
    this.router.get(
      '/:id/download',
      authenticate, // Or make public
      authorizePermissions(PERMISSIONS.FILE_READ),
      this.fileController.validate(fileIdSchema, 'params'),
      this.fileController.downloadFile,
    );
    this.router.delete(
      '/:id',
      authenticate,
      authorizePermissions(PERMISSIONS.FILE_DELETE),
      this.fileController.validate(fileIdSchema, 'params'),
      this.fileController.deleteFile,
    );
  }
}
