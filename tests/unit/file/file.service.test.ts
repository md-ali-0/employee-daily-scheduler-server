import { FileService } from '@modules/file/file.service'

// Mock PrismaClient constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    file: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  })),
}))

// Mock the prisma instance directly
jest.mock('@config/db', () => ({
  __esModule: true,
  default: {
    file: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}))

// Mock storage services
jest.mock('@utils/storage/local.storage', () => ({
  LocalStorageService: jest.fn().mockImplementation(() => ({
    uploadFile: jest.fn(),
    getFileStream: jest.fn(),
    deleteFile: jest.fn(),
  })),
}))

jest.mock('@utils/storage/cloudinary.storage', () => ({
  CloudinaryStorageService: jest.fn().mockImplementation(() => ({
    uploadFile: jest.fn(),
    getFileStream: jest.fn(),
    deleteFile: jest.fn(),
  })),
}))

jest.mock('@utils/storage/s3.storage', () => ({
  S3StorageService: jest.fn().mockImplementation(() => ({
    uploadFile: jest.fn(),
    getFileStream: jest.fn(),
    deleteFile: jest.fn(),
  })),
}))

// Mock environment config
jest.mock('@config/env', () => ({
  __esModule: true,
  default: {
    STORAGE_TYPE: 'LOCAL',
  },
}))

// Mock winston logger
jest.mock('@config/winston', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

// Mock constants to avoid Role enum issues
jest.mock('@config/constants', () => ({
  __esModule: true,
  ROLE_PERMISSIONS: {
    ADMIN: ['file:upload', 'file:read', 'file:delete'],
    EDITOR: ['file:upload', 'file:read', 'file:delete'],
    AUTHOR: ['file:upload', 'file:read'],
    USER: ['file:read'],
  },
  HTTP_STATUS: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
}))

describe('File Service', () => {
  let fileService: FileService
  let mockPrisma: any
  let mockStorageService: any

  beforeEach(() => {
    fileService = new FileService()
    mockPrisma = require('@config/db').default
    mockStorageService = require('@utils/storage/local.storage').LocalStorageService.mock.results[0].value
    jest.clearAllMocks()
  })

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File

      const userId = 'test-user-id'
      const uploadedFileData = {
        url: 'https://example.com/test.jpg',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        provider: 'LOCAL',
      }

      const createdFile = {
        id: 'file-id',
        ...uploadedFileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStorageService.uploadFile.mockResolvedValue(uploadedFileData)
      mockPrisma.file.create.mockResolvedValue(createdFile)

      const result = await fileService.uploadFile(mockFile, userId)

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(mockFile, userId)
      expect(mockPrisma.file.create).toHaveBeenCalledWith({
        data: uploadedFileData,
      })
      expect(result).toEqual(createdFile)
    })

    it('should throw error if no file provided', async () => {
      const userId = 'test-user-id'

      await expect(fileService.uploadFile(null as any, userId)).rejects.toThrow('No file provided for upload.')
    })
  })

  describe('getFileById', () => {
    it('should return file by ID successfully', async () => {
      const fileId = 'test-file-id'
      const mockFile = {
        id: fileId,
        url: 'https://example.com/test.jpg',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        provider: 'LOCAL',
      }

      mockPrisma.file.findUnique.mockResolvedValue(mockFile)

      const result = await fileService.getFileById(fileId)

      expect(mockPrisma.file.findUnique).toHaveBeenCalledWith({
        where: { id: fileId },
      })
      expect(result).toEqual(mockFile)
    })

    it('should throw error if file not found', async () => {
      const fileId = 'non-existent-id'

      mockPrisma.file.findUnique.mockResolvedValue(null)

      await expect(fileService.getFileById(fileId)).rejects.toThrow('File not found.')
    })
  })

  describe('getFileStream', () => {
    it('should return file stream successfully', async () => {
      const fileId = 'test-file-id'
      const mockFile = {
        id: fileId,
        url: 'https://example.com/test.jpg',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        provider: 'LOCAL',
      }

      const mockStream = {
        stream: {} as NodeJS.ReadableStream,
        mimeType: 'image/jpeg',
        filename: 'test.jpg',
      }

      mockPrisma.file.findUnique.mockResolvedValue(mockFile)
      mockStorageService.getFileStream.mockResolvedValue(mockStream)

      const result = await fileService.getFileStream(fileId)

      expect(mockPrisma.file.findUnique).toHaveBeenCalledWith({
        where: { id: fileId },
      })
      expect(mockStorageService.getFileStream).toHaveBeenCalledWith(fileId)
      expect(result).toEqual(mockStream)
    })

    it('should throw error if file not found', async () => {
      const fileId = 'non-existent-id'

      mockPrisma.file.findUnique.mockResolvedValue(null)

      await expect(fileService.getFileStream(fileId)).rejects.toThrow('File not found.')
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const fileId = 'test-file-id'
      const mockFile = {
        id: fileId,
        url: 'https://example.com/test.jpg',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        provider: 'LOCAL',
      }

      mockPrisma.file.findUnique.mockResolvedValue(mockFile)
      mockStorageService.deleteFile.mockResolvedValue(undefined)
      mockPrisma.file.delete.mockResolvedValue(mockFile)

      await fileService.deleteFile(fileId)

      expect(mockPrisma.file.findUnique).toHaveBeenCalledWith({
        where: { id: fileId },
      })
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(fileId)
      expect(mockPrisma.file.delete).toHaveBeenCalledWith({
        where: { id: fileId },
      })
    })

    it('should throw error if file not found', async () => {
      const fileId = 'non-existent-id'

      mockPrisma.file.findUnique.mockResolvedValue(null)

      await expect(fileService.deleteFile(fileId)).rejects.toThrow('File not found.')
    })
  })

  describe('getUserFiles', () => {
    it('should return user files successfully', async () => {
      const userId = 'test-user-id'
      const mockFiles = [
        {
          id: 'file-1',
          url: 'https://example.com/file1.jpg',
          filename: 'file1.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          provider: 'LOCAL',
        },
        {
          id: 'file-2',
          url: 'https://example.com/file2.jpg',
          filename: 'file2.jpg',
          mimeType: 'image/jpeg',
          size: 2048,
          provider: 'LOCAL',
        },
      ]

      mockPrisma.file.findMany.mockResolvedValue(mockFiles)

      const result = await fileService.getUserFiles(userId)

      expect(mockPrisma.file.findMany).toHaveBeenCalledWith({
        where: { uploadedById: userId },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockFiles)
    })
  })

  describe('getAll', () => {
    it('should return all files with pagination', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          url: 'https://example.com/file1.jpg',
          filename: 'file1.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          provider: 'LOCAL',
          uploadedBy: { id: 'user-1', name: 'User 1', email: 'user1@example.com' },
        },
      ]
      const totalItems = 1

      mockPrisma.file.findMany.mockResolvedValue(mockFiles)
      mockPrisma.file.count.mockResolvedValue(totalItems)

      const result = await fileService.getAll()

      expect(mockPrisma.file.findMany).toHaveBeenCalledWith({
        where: { AND: [{ deletedAt: null }] },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
      expect(result.data).toEqual(mockFiles)
      expect(result.pagination.total).toBe(totalItems)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(10)
    })

    it('should apply search filters correctly', async () => {
      const mockFiles: any[] = []
      const totalItems = 0

      mockPrisma.file.findMany.mockResolvedValue(mockFiles)
      mockPrisma.file.count.mockResolvedValue(totalItems)

      const result = await fileService.getAll({
        searchTerm: 'test',
        mimeType: 'image/jpeg',
        provider: 'LOCAL',
        page: 2,
        limit: 5,
      })

      expect(mockPrisma.file.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              OR: [
                { filename: { contains: 'test', mode: 'insensitive' } },
                { mimeType: { contains: 'test', mode: 'insensitive' } },
                { url: { contains: 'test', mode: 'insensitive' } },
              ],
            },
            { AND: [{ mimeType: 'image/jpeg' }, { provider: 'LOCAL' }] },
            { deletedAt: null },
          ],
        },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 5,
      })
      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(5)
    })

    it('should include deleted files when delete filter is YES', async () => {
      const mockFiles: any[] = []
      const totalItems = 0

      mockPrisma.file.findMany.mockResolvedValue(mockFiles)
      mockPrisma.file.count.mockResolvedValue(totalItems)

      await fileService.getAll({ delete: 'YES' })

      expect(mockPrisma.file.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })
  })
}) 