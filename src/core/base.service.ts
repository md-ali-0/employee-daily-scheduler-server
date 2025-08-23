// import mongoose if needed for types
import { calculatePagination, createPaginationMeta } from '@utils/pagination.util';

interface BaseFilters {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  delete?: string;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
export class BaseService<T> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  async findById(id: string) {
    return this.model.findById(id);
  }

  async findAll() {
    return this.model.find();
  }

  async create(data: any, changedBy?: string, ipAddress?: string, userAgent?: string) {
    return this.model.create(data);
  }

  async getAll(filters: BaseFilters = {}): Promise<PaginatedResult<T>> {
    const { page, limit, searchTerm, sortBy, sortOrder, delete: isDelete } = filters;
    const shouldIncludeDeleted = isDelete === 'YES';
    const whereConditions: any = {};
    if (!shouldIncludeDeleted) {
      whereConditions.deletedAt = null;
    }

    const paginationOptions = {
      page: page || 1,
      limit: limit || 10,
      sortBy,
      sortOrder: sortOrder || 'desc',
    };

    const {
      page: currentPage,
      limit: currentLimit,
      skip,
      sortBy: currentSortBy,
      sortOrder: currentSortOrder,
    } = calculatePagination(paginationOptions);

    const sortConditions: any = {};
    if (currentSortBy && currentSortOrder) {
      sortConditions[currentSortBy] = currentSortOrder === 'asc' ? 1 : -1;
    } else {
      sortConditions.createdAt = -1;
    }

    const [data, total] = await Promise.all([
      this.model.find(whereConditions)
        .sort(sortConditions)
        .skip(skip)
        .limit(currentLimit),
      this.model.countDocuments(whereConditions),
    ]);

    const pagination = createPaginationMeta(total, currentPage, currentLimit);

    return {
      data,
      pagination,
    };
  }

  async update(id: string, data: any, changedBy?: string, ipAddress?: string, userAgent?: string) {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async softDelete(id: string, changedBy?: string, ipAddress?: string, userAgent?: string) {
    return this.model.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
  }

  async restore(id: string, changedBy?: string, ipAddress?: string, userAgent?: string) {
    return this.model.findByIdAndUpdate(id, { deletedAt: null }, { new: true });
  }

  async hardDelete(id: string, changedBy?: string, ipAddress?: string, userAgent?: string) {
    return this.model.findByIdAndDelete(id);
  }

  // Removed duplicate methods

  async bulkSoftDelete(ids: string[], changedBy?: string, ipAddress?: string, userAgent?: string) {
    return this.model.updateMany({ _id: { $in: ids } }, { deletedAt: new Date() });
  }

  async bulkHardDelete(ids: string[], changedBy?: string, ipAddress?: string, userAgent?: string) {
    return this.model.deleteMany({ _id: { $in: ids } });
  }

  async exportData(format: string) {
    const data = await this.model.find();
    // Basic implementation - in a real app, you'd want proper CSV/Excel generation
    return Buffer.from(JSON.stringify(data, null, 2));
  }
}