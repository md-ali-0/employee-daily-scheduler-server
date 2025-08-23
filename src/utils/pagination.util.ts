export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Calculate pagination parameters
 * @param options - Pagination options
 * @returns Pagination result with calculated values
 */
export const calculatePagination = (options: PaginationOptions): PaginationResult => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy;
  const sortOrder = options.sortOrder || 'desc';

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

/**
 * Create pagination metadata
 * @param total - Total number of items
 * @param page - Current page
 * @param limit - Items per page
 * @returns Pagination metadata object
 */
export const createPaginationMeta = (total: number, page: number, limit: number) => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
