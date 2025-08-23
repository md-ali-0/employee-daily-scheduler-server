import { config } from 'dotenv'

// Load environment variables for testing
config({ path: '.env.test' })

// Set test environment
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret'
process.env.REDIS_HOST = 'localhost'
process.env.REDIS_PORT = '6379'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/blog_test'
process.env.SESSION_SECRET = 'test-session-secret'
process.env.API_KEY_SECRET = 'test-api-key-secret'
process.env.STORAGE_TYPE = 'LOCAL'
process.env.EMAIL_HOST = 'localhost'
process.env.EMAIL_PORT = '1025'
process.env.EMAIL_USER = 'test@example.com'
process.env.EMAIL_PASS = 'test-password'
process.env.EMAIL_FROM = 'noreply@test.com'
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3001/api/v1/auth/google/callback'

// Mock response utilities first (before other mocks)
jest.mock('@core/response.util', () => ({
  successResponse: jest.fn((res: any, message: string, data?: any, statusCode?: number) => {
    return res.status(statusCode || 200).json({
      success: true,
      message,
      data,
      statusCode: statusCode || 200
    })
  }),
  errorResponse: jest.fn((res: any, message: string, statusCode?: number, errorDetails?: any, stack?: string) => {
    return res.status(statusCode || 500).json({
      success: false,
      message,
      error: {
        data: {
          message,
          stack: stack || '',
          errorMessage: errorDetails || { path: '', message: '' },
          success: false
        },
        status: statusCode || 500
      },
      statusCode: statusCode || 500
    })
  }),
  validationErrorResponse: jest.fn((res: any, errors: any[], message?: string, statusCode?: number) => {
    return res.status(statusCode || 422).json({
      success: false,
      message: message || 'Validation failed',
      error: {
        data: {
          message: message || 'Validation failed',
          stack: '',
          errorMessage: { path: '', message: 'Validation failed' },
          success: false
        },
        status: statusCode || 422
      },
      statusCode: statusCode || 422
    })
  }),
  paginatedResponse: jest.fn((res: any, message: string, data: any, statusCode?: number) => {
    return res.status(statusCode || 200).json({
      success: true,
      message,
      data: data.data || data,
      meta: data.meta || {},
      statusCode: statusCode || 200
    })
  })
}))

// Mock external dependencies
jest.mock('@config/redis', () => ({
  redis: {
    ping: jest.fn().mockResolvedValue('PONG'),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    disconnect: jest.fn(),
  }
}))

jest.mock('@config/winston', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }
}))

jest.mock('@config/sentry', () => ({
  Sentry: {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
  },
  setupSentryErrorHandler: jest.fn(),
}))

jest.mock('@jobs/queue', () => ({
  emailQueue: {
    add: jest.fn(),
  },
  imageProcessingQueue: {
    add: jest.fn(),
  },
  postPublishingQueue: {
    add: jest.fn(),
  },
  addEmailJob: jest.fn(),
  addWelcomeEmailJob: jest.fn(),
  addLoginNotificationJob: jest.fn(),
  addPostApprovedEmailJob: jest.fn(),
  addPostRejectedEmailJob: jest.fn(),
  addPasswordResetEmailJob: jest.fn(),
  addCommentNotificationJob: jest.fn(),
}))

jest.mock('@jobs/worker', () => ({
  startWorkers: jest.fn(),
}))

// Mock database configuration
jest.mock('@config/db', () => ({
  __esModule: true,
  default: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tag: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    series: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    comment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    like: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    bookmark: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }
}))

// Mock CSRF middleware to disable CSRF protection in tests
jest.mock('@middlewares/csrf.middleware', () => ({
  sessionMiddleware: jest.fn((req: any, res: any, next: any) => next()),
  csrfProtection: jest.fn((req: any, res: any, next: any) => next()),
  csrfErrorHandler: jest.fn((err: any, req: any, res: any, next: any) => next()),
  setCsrfToken: jest.fn((req: any, res: any, next: any) => next()),
}))

// Mock i18n for translations
jest.mock('@config/i18n', () => ({
  __: jest.fn((key: string, options?: any) => {
    // Return the key itself for simple cases, or a formatted string for complex ones
    if (options && typeof options === 'object') {
      return key.replace(/\{(\w+)\}/g, (match, key) => options[key] || match)
    }
    return key
  }),
  setLocale: jest.fn(),
  getLocale: jest.fn(() => 'en'),
}))

// Mock i18n-compat for compatibility layer
jest.mock('@config/i18n-compat', () => ({
  __esModule: true,
  default: {
    __: jest.fn((key: string, options?: any) => {
      // Return the key itself for simple cases, or a formatted string for complex ones
      if (options && typeof options === 'object') {
        return key.replace(/\{(\w+)\}/g, (match, key) => options[key] || match)
      }
      return key
    }),
    t: jest.fn((key: string, options?: any) => {
      // Return the key itself for simple cases, or a formatted string for complex ones
      if (options && typeof options === 'object') {
        return key.replace(/\{(\w+)\}/g, (match, key) => options[key] || match)
      }
      return key
    }),
  }
}))

// Test utilities
export const testUtils = {
  // Mock user data
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },

  mockAdminUser: {
    id: 'admin-user-id',
    email: 'admin@example.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },

  // Mock post data
  mockPost: {
    id: 'test-post-id',
    title: 'Test Post',
    slug: 'test-post',
    content: 'This is a test post content',
    excerpt: 'Test post excerpt',
    status: 'PUBLISHED',
    authorId: 'test-user-id',
    categoryId: 'test-category-id',
    featuredImage: 'https://example.com/image.jpg',
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },

  // Mock category data
  mockCategory: {
    id: 'test-category-id',
    name: 'Test Category',
    slug: 'test-category',
    description: 'Test category description',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },

  // Mock tag data
  mockTag: {
    id: 'test-tag-id',
    name: 'Test Tag',
    slug: 'test-tag',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },

  // Mock series data
  mockSeries: {
    id: 'test-series-id',
    name: 'Test Series',
    slug: 'test-series',
    description: 'Test series description',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },

  // Mock comment data
  mockComment: {
    id: 'test-comment-id',
    content: 'Test comment content',
    postId: 'test-post-id',
    authorId: 'test-user-id',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },

  // Mock like data
  mockLike: {
    id: 'test-like-id',
    postId: 'test-post-id',
    userId: 'test-user-id',
    createdAt: new Date(),
  },

  // Mock bookmark data
  mockBookmark: {
    id: 'test-bookmark-id',
    postId: 'test-post-id',
    userId: 'test-user-id',
    createdAt: new Date(),
  },

  // Mock permission data
  mockPermissions: [
    {
      id: 'perm-1',
      name: 'read:posts',
      description: 'Read posts',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm-2',
      name: 'write:posts',
      description: 'Write posts',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ],

  // Generate test JWT token
  generateTestToken: (userId: string, role: string = 'USER') => {
    const jwt = require('jsonwebtoken')
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET || 'test-jwt-secret',
      { expiresIn: '1h' }
    )
  }
} 