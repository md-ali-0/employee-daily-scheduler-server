import mongoose from 'mongoose';
import { BadRequestError, NotFoundError } from '../../../src/core/error.classes';
import { FileService } from '../../../src/modules/file/file.service';
import { utils } from '../../setup';

// Mock storage providers
jest.mock('../../../src/utils/storage/cloudinary.storage');
jest.mock('../../../src/utils/storage/local.storage');
jest.mock('../../../src/utils/storage/s3.storage');

describe('FileService', () => {
  let fileService: FileService;
  let testUser: any;

  beforeEach(async () => {
    fileService = new FileService();
    testUser = await utils.createTestUser();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test file content')
      };

      const mockUploadResult = {
        url: 'https://example.com/test.jpg',
        publicId: 'test-public-id',
        filename: 'test.jpg'
      };

      // Mock the storage upload method
      (fileService as any).storage.upload = jest.fn().mockResolvedValue(mockUploadResult);

      const result = await fileService.uploadFile(mockFile, testUser._id.toString());

      expect(result).toBeDefined();
      expect(result.url).toBe(mockUploadResult.url);
      expect(result.filename).toBe(mockFile.originalname);
      expect(result.uploadedBy.toString()).toBe(testUser._id.toString());
    });

    it('should throw error for unsupported file type', async () => {
      const mockFile = {
        originalname: 'test.exe',
        mimetype: 'application/x-executable',
        size: 1024,
        buffer: Buffer.from('test file content')
      };

      await expect(fileService.uploadFile(mockFile, testUser._id.toString())).rejects.toThrow(BadRequestError);
    });

    it('should throw error for file too large', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 50 * 1024 * 1024, // 50MB
        buffer: Buffer.from('test file content')
      };

      await expect(fileService.uploadFile(mockFile, testUser._id.toString())).rejects.toThrow(BadRequestError);
    });
  });

  describe('getFileById', () => {
    it('should get file by id', async () => {
      const mockFile = {
        _id: new mongoose.Types.ObjectId(),
        filename: 'test.jpg',
        url: 'https://example.com/test.jpg',
        uploadedBy: testUser._id
      };

      // Mock the findById method
      (fileService as any).model.findById = jest.fn().mockResolvedValue(mockFile);

      const file = await fileService.getFileById(mockFile._id.toString());

      expect(file).toBeDefined();
      expect(file._id.toString()).toBe(mockFile._id.toString());
      expect(file.filename).toBe(mockFile.filename);
    });

    it('should throw error when file not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      // Mock the findById method to return null
      (fileService as any).model.findById = jest.fn().mockResolvedValue(null);

      await expect(fileService.getFileById(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAllFiles', () => {
    it('should return paginated files', async () => {
      const mockFiles = [
        { _id: new mongoose.Types.ObjectId(), filename: 'file1.jpg' },
        { _id: new mongoose.Types.ObjectId(), filename: 'file2.jpg' }
      ];

      const mockResult = {
        data: mockFiles,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      };

      // Mock the getAll method
      (fileService as any).getAll = jest.fn().mockResolvedValue(mockResult);

      const result = await fileService.getAllFiles({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(2);
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const mockFile = {
        _id: new mongoose.Types.ObjectId(),
        filename: 'test.jpg',
        url: 'https://example.com/test.jpg',
        publicId: 'test-public-id'
      };

      // Mock the findById method
      (fileService as any).model.findById = jest.fn().mockResolvedValue(mockFile);
      
      // Mock the storage delete method
      (fileService as any).storage.delete = jest.fn().mockResolvedValue(true);
      
      // Mock the model delete method
      (fileService as any).model.findByIdAndDelete = jest.fn().mockResolvedValue(mockFile);

      await expect(fileService.deleteFile(mockFile._id.toString())).resolves.not.toThrow();
    });

    it('should throw error when file not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      // Mock the findById method to return null
      (fileService as any).model.findById = jest.fn().mockResolvedValue(null);

      await expect(fileService.deleteFile(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateFile', () => {
    it('should update file metadata successfully', async () => {
      const mockFile = {
        _id: new mongoose.Types.ObjectId(),
        filename: 'test.jpg',
        url: 'https://example.com/test.jpg'
      };

      const updateData = {
        description: 'Updated description',
        tags: ['image', 'test']
      };

      // Mock the findById method
      (fileService as any).model.findById = jest.fn().mockResolvedValue(mockFile);
      
      // Mock the update method
      (fileService as any).update = jest.fn().mockResolvedValue({
        ...mockFile,
        ...updateData
      });

      const updatedFile = await fileService.updateFile(mockFile._id.toString(), updateData);

      expect(updatedFile).toBeDefined();
      expect(updatedFile.description).toBe(updateData.description);
      expect(updatedFile.tags).toEqual(updateData.tags);
    });

    it('should throw error when file not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updateData = { description: 'Updated' };

      // Mock the findById method to return null
      (fileService as any).model.findById = jest.fn().mockResolvedValue(null);

      await expect(fileService.updateFile(fakeId, updateData)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getFilesByUser', () => {
    it('should return files uploaded by specific user', async () => {
      const mockFiles = [
        { _id: new mongoose.Types.ObjectId(), filename: 'file1.jpg', uploadedBy: testUser._id },
        { _id: new mongoose.Types.ObjectId(), filename: 'file2.jpg', uploadedBy: testUser._id }
      ];

      // Mock the find method
      (fileService as any).model.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockFiles)
          })
        })
      });

      const files = await fileService.getFilesByUser(testUser._id.toString(), { page: 1, limit: 10 });

      expect(files).toBeDefined();
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBe(2);
    });
  });

  describe('searchFiles', () => {
    it('should search files by filename', async () => {
      const mockFiles = [
        { _id: new mongoose.Types.ObjectId(), filename: 'test-image.jpg' }
      ];

      // Mock the find method
      (fileService as any).model.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockFiles)
          })
        })
      });

      const files = await fileService.searchFiles('test', { page: 1, limit: 10 });

      expect(files).toBeDefined();
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBe(1);
    });
  });

  describe('getFileStats', () => {
    it('should return file statistics', async () => {
      const mockStats = {
        totalFiles: 10,
        totalSize: 1024000,
        fileTypes: {
          'image/jpeg': 5,
          'image/png': 3,
          'application/pdf': 2
        }
      };

      // Mock the aggregate method
      (fileService as any).model.aggregate = jest.fn().mockResolvedValue([mockStats]);

      const stats = await fileService.getFileStats();

      expect(stats).toBeDefined();
      expect(stats.totalFiles).toBe(mockStats.totalFiles);
      expect(stats.totalSize).toBe(mockStats.totalSize);
      expect(stats.fileTypes).toBeDefined();
    });
  });

  describe('validateFileType', () => {
    it('should validate allowed file types', () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      
      allowedTypes.forEach(type => {
        expect(() => fileService.validateFileType(type)).not.toThrow();
      });
    });

    it('should throw error for disallowed file types', () => {
      const disallowedTypes = ['application/x-executable', 'text/html'];
      
      disallowedTypes.forEach(type => {
        expect(() => fileService.validateFileType(type)).toThrow(BadRequestError);
      });
    });
  });

  describe('validateFileSize', () => {
    it('should validate file size within limit', () => {
      const validSizes = [1024, 1024 * 1024, 5 * 1024 * 1024]; // 1KB, 1MB, 5MB
      
      validSizes.forEach(size => {
        expect(() => fileService.validateFileSize(size)).not.toThrow();
      });
    });

    it('should throw error for files too large', () => {
      const invalidSizes = [50 * 1024 * 1024, 100 * 1024 * 1024]; // 50MB, 100MB
      
      invalidSizes.forEach(size => {
        expect(() => fileService.validateFileSize(size)).toThrow(BadRequestError);
      });
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail for image files', async () => {
      const mockThumbnailUrl = 'https://example.com/thumb.jpg';
      
      // Mock the storage generateThumbnail method
      (fileService as any).storage.generateThumbnail = jest.fn().mockResolvedValue(mockThumbnailUrl);

      const thumbnailUrl = await fileService.generateThumbnail('test.jpg', 'image/jpeg');

      expect(thumbnailUrl).toBe(mockThumbnailUrl);
    });

    it('should return null for non-image files', async () => {
      const thumbnailUrl = await fileService.generateThumbnail('test.pdf', 'application/pdf');

      expect(thumbnailUrl).toBeNull();
    });
  });

  describe('getFileDownloadUrl', () => {
    it('should generate download URL for file', async () => {
      const mockDownloadUrl = 'https://example.com/download/test.jpg';
      
      // Mock the storage getDownloadUrl method
      (fileService as any).storage.getDownloadUrl = jest.fn().mockResolvedValue(mockDownloadUrl);

      const downloadUrl = await fileService.getFileDownloadUrl('test.jpg');

      expect(downloadUrl).toBe(mockDownloadUrl);
    });
  });
}); 