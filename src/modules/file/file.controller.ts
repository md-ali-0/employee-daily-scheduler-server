import i18n from '@config/i18n-compat';
import {
  errorResponse,
  paginatedResponse,
  successResponse,
  validationErrorResponse,
} from '@core/response.util';
import { AuditLogUtil } from '@utils/audit-log.util';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { AnyZodObject } from 'zod';
import { FileService } from './file.service';

export class FileController {
  private fileService: FileService;
  private auditLogUtil: AuditLogUtil;

  constructor() {
    this.fileService = new FileService();
    this.auditLogUtil = new AuditLogUtil();
  }

  private catchAsync =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) =>
      fn(req, res, next).catch(next);

  uploadFile = this.catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return errorResponse(res, i18n.__('errors.user_not_authenticated'), 403, {
        path: req.path,
        message: i18n.__('errors.user_not_authenticated'),
      });
    }
    if (!req.file) {
      return errorResponse(res, i18n.__('errors.no_file_provided_for_upload'), 400, {
        path: req.path,
        message: i18n.__('errors.no_file_provided_for_upload'),
      });
    }
    const uploadedFile = await this.fileService.uploadFile(req.file, req.user.id);
    await this.auditLogUtil.logAudit(
      'file',
      uploadedFile.id,
      'UPLOAD',
      null,
      uploadedFile,
      req.user.id,
      req.ip,
      req.headers['user-agent'] as string,
    );
    successResponse(res, i18n.__('file.upload_success'), uploadedFile, 201);
  });

  getFileById = this.catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const file = await this.fileService.getFileById(id);
    successResponse(res, i18n.__('file.retrieve_success'), file);
  });

  getAll = this.catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      includeDeleted,
      mimeType,
      provider,
      uploadedBy,
    } = req.query as any;

    const filters = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      searchTerm: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      delete: includeDeleted ? 'YES' : 'NO',
      mimeType: mimeType as string,
      provider: provider as string,
      uploadedBy: uploadedBy as string,
    };

    const result = await this.fileService.getAll(filters);

    paginatedResponse(res, i18n.__('file.retrieve_all_success'), result);
  });

  downloadFile = this.catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const { stream, mimeType, filename } = await this.fileService.getFileStream(id);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      stream.pipe(res);
    } catch (err: any) {
      return errorResponse(
        res,
        err.message || i18n.__('errors.file_not_found_or_not_stored_locally'),
        404,
        {
          path: req.path,
          message: err.message || i18n.__('errors.file_not_found_or_not_stored_locally'),
        },
      );
    }
  });

  deleteFile = this.catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return errorResponse(res, i18n.__('errors.user_not_authenticated'), 403, {
        path: req.path,
        message: i18n.__('errors.user_not_authenticated'),
      });
    }
    const { id } = req.params;
    await this.fileService.deleteFile(id);
    await this.auditLogUtil.logAudit(
      'file',
      id,
      'DELETE',
      null,
      null,
      req.user.id,
      req.ip,
      req.headers['user-agent'] as string,
    );
    successResponse(res, i18n.__('file.delete_success'), null);
  });

  validate(schema: AnyZodObject, property: 'body' | 'params' | 'query'): RequestHandler {
    return (req, res, next) => {
      try {
        schema.parse(req[property]);
        next();
      } catch (err: any) {
        return validationErrorResponse(res, err.errors, 'Validation failed', 400);
      }
    };
  }
}
