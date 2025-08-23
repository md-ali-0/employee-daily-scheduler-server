import { HTTP_STATUS } from '@config/constants';
import i18n from '@config/i18n-compat';
import type { NextFunction, Request, Response } from 'express';
import type { BaseService } from './base.service';
import { NotFoundError } from './error.classes';
import { paginatedResponse, successResponse } from './response.util';

interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

/**
 * BaseController provides common CRUD controller methods.
 * @template T The Prisma model type.
 */
export class BaseController<T> {
  protected service: BaseService<T>;

  constructor(service: BaseService<T>) {
    this.service = service;
  }

  /**
   * Wrapper for async Express route handlers to catch errors.
   */
  protected catchAsync =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) =>
      fn(req, res, next).catch(next);

  /**
   * ✅ Create a new record
   */
  create = this.catchAsync(async (req: Request, res: Response) => {
    const record = await this.service.create(
      req.body,
      req.user?.id,
      req.ip,
      req.headers['user-agent'],
    );
    successResponse(res, i18n.__('common.create_success'), record, HTTP_STATUS.CREATED);
  });

  /**
   * ✅ Get a single record by ID
   */
  getById = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const record = await this.service.findById(id);

    if (!record) {
      throw new NotFoundError(i18n.__('common.not_found', { id }), 'common.not_found', { id });
    }

    successResponse(res, i18n.__('common.fetch_success'), record);
  });

  /**
   * ✅ Get all records with pagination, sorting & optional soft-delete filter
   */
  getAll = this.catchAsync(async (req: Request, res: Response) => {
    const { page, limit, search, sortBy, sortOrder, includeDeleted } =
      req.query as unknown as PaginationQuery;

    const filters = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      searchTerm: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      delete: includeDeleted ? 'YES' : 'NO',
    };

    const result = await this.service.getAll(filters);

    paginatedResponse(res, i18n.__('common.fetch_all_success'), result);
  });

  /**
   * ✅ Update record by ID
   */
  update = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updatedRecord = await this.service.update(
      id,
      req.body,
      req.user?.id,
      req.ip,
      req.headers['user-agent'],
    );
    successResponse(res, i18n.__('common.update_success'), updatedRecord);
  });

  /**
   * ✅ Soft delete record by ID
   */
  softDelete = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.service.softDelete(id, req.user?.id, req.ip, req.headers['user-agent']);
    successResponse(res, i18n.__('common.delete_success'), null, HTTP_STATUS.NO_CONTENT);
  });

  /**
   * ✅ Restore soft-deleted record
   */
  restore = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const restored = await this.service.restore(
      id,
      req.user?.id,
      req.ip,
      req.headers['user-agent'],
    );
    successResponse(res, i18n.__('common.restore_success'), restored);
  });

  /**
   * ✅ Hard delete record permanently
   */
  hardDelete = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.service.hardDelete(id, req.user?.id, req.ip, req.headers['user-agent']);
    successResponse(res, i18n.__('common.hard_delete_success'), null, HTTP_STATUS.NO_CONTENT);
  });

  /**
   * ✅ Bulk soft delete
   * Expects array of IDs in req.body.ids
   */
  bulkSoftDelete = this.catchAsync(async (req: Request, res: Response) => {
    const ids = req.body.ids as string[];
    await this.service.bulkSoftDelete(ids, req.user?.id, req.ip, req.headers['user-agent']);
    successResponse(res, i18n.__('common.bulk_delete_success'), null, HTTP_STATUS.NO_CONTENT);
  });

  /**
   * ✅ Bulk hard delete
   */
  bulkHardDelete = this.catchAsync(async (req: Request, res: Response) => {
    const ids = req.body.ids as string[];
    await this.service.bulkHardDelete(ids, req.user?.id, req.ip, req.headers['user-agent']);
    successResponse(res, i18n.__('common.bulk_hard_delete_success'), null, HTTP_STATUS.NO_CONTENT);
  });

  /**
   * ✅ Export records (CSV/Excel)
   * Expects `format` query param
   */
  export = this.catchAsync(async (req: Request, res: Response) => {
    const { format } = req.query;
    const fileBuffer = await this.service.exportData(format as string);
    res.setHeader('Content-Disposition', `attachment; filename=export.${format}`);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel');
    res.send(fileBuffer);
  });
}
