import env from '@config/env';
import logger from '@config/winston';
import { FileModel } from './file.model';

import { BadRequestError } from '@core/error.classes';
import { calculatePagination, createPaginationMeta } from '@utils/pagination.util';
import { CloudinaryStorageService } from '@utils/storage/cloudinary.storage';
import { LocalStorageService } from '@utils/storage/local.storage';
import { S3StorageService } from '@utils/storage/s3.storage';
import type { IStorageService } from '@utils/storage/storage.interface';
import type { IFile } from './file.interface';

interface FileFilters {
  searchTerm?: string;
  mimeType?: string;
  provider?: string;
  uploadedBy?: string;
  delete?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

export class FileService {
  private storageService: IStorageService;

  constructor() {
    switch (env.STORAGE_TYPE) {
      case 'S3':
        this.storageService = new S3StorageService();
        break;
      case 'CLOUDINARY':
        this.storageService = new CloudinaryStorageService();
        break;
      case 'LOCAL':
      default:
        this.storageService = new LocalStorageService();
        break;
    }
    logger.info(`Using storage type: ${env.STORAGE_TYPE || 'LOCAL'}`);
  }

  /**
   * Upload file and create DB record
   */
  async uploadFile(file: Express.Multer.File, userId: string): Promise<IFile> {
    if (!file) {
      throw new BadRequestError('No file provided for upload.');
    }

    // 1️⃣ Upload to storage service
    const uploadedFile = await this.storageService.uploadFile(file, userId);

    // 2️⃣ Save record in DB
    const newFile = await FileModel.create({
      url: uploadedFile.url,
      filename: uploadedFile.filename,
      mimeType: uploadedFile.mimeType,
      size: uploadedFile.size,
      provider: uploadedFile.provider,
      uploadedBy: userId,
    });
    return newFile;
  }

  /**
   * Fetch a file record by ID
   */
  async getFileById(fileId: string): Promise<IFile> {
    const file = await FileModel.findById(fileId);
    if (!file) {
      throw new BadRequestError('File not found.');
    }
    return file;
  }

  /**
   * Get a file stream from storage
   */
  async getFileStream(
    fileId: string,
  ): Promise<{ stream: NodeJS.ReadableStream; mimeType: string; filename: string }> {
    const fileRecord = await FileModel.findById(fileId);
    if (!fileRecord) {
      throw new BadRequestError('File not found.');
    }
    return this.storageService.getFileStream(fileRecord._id.toString());
  }

  /**
   * Delete a file (both DB + storage)
   */
  async deleteFile(fileId: string): Promise<void> {
    const fileRecord = await FileModel.findById(fileId);
    if (!fileRecord) {
      throw new BadRequestError('File not found.');
    }
    // Delete from storage
    await this.storageService.deleteFile(fileRecord._id.toString());
    // Delete from DB
    await FileModel.findByIdAndDelete(fileId);
  }

  /**
   * Optional: List all files for a user
   */
  async getUserFiles(userId: string): Promise<IFile[]> {
    return FileModel.find({ uploadedBy: userId }).sort({ createdAt: -1 });
  }

  /**
   * Get all files with pagination, filtering, and sorting
   */
  async getAll(filters: FileFilters = {}): Promise<PaginatedResult<IFile>> {
    const {
      searchTerm,
      delete: isDelete,
      sortBy,
      sortOrder,
      page,
      limit,
      ...filtersData
    } = filters;

  // Set default values
  const shouldIncludeDeleted = isDelete !== 'YES';

    // Build search and filter conditions for Mongoose
    const query: any = {};
    if (searchTerm) {
      query.$or = [
        { filename: { $regex: searchTerm, $options: 'i' } },
        { mimeType: { $regex: searchTerm, $options: 'i' } },
        { url: { $regex: searchTerm, $options: 'i' } },
      ];
    }
    Object.entries(filtersData).forEach(([field, value]) => {
      if (field === 'uploadedBy' && typeof value === 'string') {
        query.uploadedBy = value;
      } else if (typeof value === 'string') {
        query[field] = value;
      }
    });
    if (shouldIncludeDeleted) {
      query.deletedAt = null;
    }

    // Calculate pagination
    const paginationOptions = {
      page: page || 1,
      limit: limit || 10,
      sortBy: sortBy,
      sortOrder: sortOrder || 'desc',
    };

    const {
      page: currentPage,
      limit: currentLimit,
      skip,
      sortBy: currentSortBy,
      sortOrder: currentSortOrder,
    } = calculatePagination(paginationOptions);

    // Build sort conditions
    const sortConditions: any = {};
    if (currentSortBy && currentSortOrder) {
      sortConditions[currentSortBy] = currentSortOrder === 'asc' ? 1 : -1;
    } else {
      sortConditions.createdAt = -1; // Default sort
    }

    // Execute query
    const [files, total] = await Promise.all([
      FileModel.find(query)
        .populate('uploadedBy', 'id name email')
        .sort(sortConditions)
        .skip(skip)
        .limit(currentLimit),
      FileModel.countDocuments(query),
    ]);

    const pagination = createPaginationMeta(total, currentPage, currentLimit);

    return {
      data: files,
      pagination,
    };
  }
}
