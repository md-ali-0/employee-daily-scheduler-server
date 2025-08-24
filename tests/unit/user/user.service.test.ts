import mongoose from 'mongoose';
import { BadRequestError, NotFoundError } from '../../../src/core/error.classes';
import { UserService } from '../../../src/modules/user/user.service';
import { utils } from '../../setup';

describe('UserService', () => {
  let userService: UserService;
  let testUser: any;

  beforeEach(async () => {
    userService = new UserService();
    testUser = await utils.createTestUser();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'USER'
      };

      const user = await userService.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(userData.role);
    });

    it('should throw error when email already exists', async () => {
      const userData = {
        email: testUser.email, // Already exists
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      await expect(userService.create(userData)).rejects.toThrow(BadRequestError);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const user = await userService.findById(testUser._id.toString());

      expect(user).toBeDefined();
      expect(user._id.toString()).toBe(testUser._id.toString());
      expect(user.email).toBe(testUser.email);
    });

    it('should throw error when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(userService.findById(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const user = await userService.findByEmail(testUser.email);

      expect(user).toBeDefined();
      expect(user.email).toBe(testUser.email);
    });

    it('should return null when user not found', async () => {
      const user = await userService.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return paginated users', async () => {
      // Create additional users
      await utils.createTestUser({ email: 'user2@example.com' });
      await utils.createTestUser({ email: 'user3@example.com' });

      const result = await userService.getAll({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should filter users by search term', async () => {
      await utils.createTestUser({ email: 'developer@example.com', firstName: 'John' });
      await utils.createTestUser({ email: 'designer@example.com', firstName: 'Jane' });

      const result = await userService.getAll({ 
        page: 1, 
        limit: 10, 
        searchTerm: 'developer' 
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.some(user => user.email.includes('developer'))).toBe(true);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '1234567890'
      };

      const updatedUser = await userService.update(testUser._id.toString(), updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser.firstName).toBe(updateData.firstName);
      expect(updatedUser.lastName).toBe(updateData.lastName);
      expect(updatedUser.phone).toBe(updateData.phone);
    });

    it('should throw error when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updateData = { firstName: 'Updated' };

      await expect(userService.update(fakeId, updateData)).rejects.toThrow(NotFoundError);
    });
  });

  describe('softDelete', () => {
    it('should soft delete user successfully', async () => {
      await userService.softDelete(testUser._id.toString());

      // User should still exist but with deletedAt set
      const deletedUser = await userService.findById(testUser._id.toString());
      expect(deletedUser.deletedAt).toBeDefined();
    });

    it('should throw error when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(userService.softDelete(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('restore', () => {
    it('should restore soft deleted user successfully', async () => {
      // First soft delete
      await userService.softDelete(testUser._id.toString());

      // Then restore
      const restoredUser = await userService.restore(testUser._id.toString());

      expect(restoredUser.deletedAt).toBeNull();
    });

    it('should throw error when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(userService.restore(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete user successfully', async () => {
      await userService.hardDelete(testUser._id.toString());

      // User should be completely removed
      await expect(userService.findById(testUser._id.toString())).rejects.toThrow(NotFoundError);
    });

    it('should throw error when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(userService.hardDelete(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('bulkSoftDelete', () => {
    it('should soft delete multiple users successfully', async () => {
      const user2 = await utils.createTestUser({ email: 'user2@example.com' });
      const user3 = await utils.createTestUser({ email: 'user3@example.com' });

      const userIds = [testUser._id.toString(), user2._id.toString(), user3._id.toString()];

      await userService.bulkSoftDelete(userIds);

      // All users should be soft deleted
      const deletedUser1 = await userService.findById(testUser._id.toString());
      const deletedUser2 = await userService.findById(user2._id.toString());
      const deletedUser3 = await userService.findById(user3._id.toString());

      expect(deletedUser1.deletedAt).toBeDefined();
      expect(deletedUser2.deletedAt).toBeDefined();
      expect(deletedUser3.deletedAt).toBeDefined();
    });
  });

  describe('bulkHardDelete', () => {
    it('should hard delete multiple users successfully', async () => {
      const user2 = await utils.createTestUser({ email: 'user2@example.com' });
      const user3 = await utils.createTestUser({ email: 'user3@example.com' });

      const userIds = [testUser._id.toString(), user2._id.toString(), user3._id.toString()];

      await userService.bulkHardDelete(userIds);

      // All users should be completely removed
      await expect(userService.findById(testUser._id.toString())).rejects.toThrow(NotFoundError);
      await expect(userService.findById(user2._id.toString())).rejects.toThrow(NotFoundError);
      await expect(userService.findById(user3._id.toString())).rejects.toThrow(NotFoundError);
    });
  });

  describe('exportData', () => {
    it('should export users as CSV', async () => {
      await utils.createTestUser({ email: 'user2@example.com' });

      const csvBuffer = await userService.exportData('csv');

      expect(csvBuffer).toBeDefined();
      expect(Buffer.isBuffer(csvBuffer)).toBe(true);
      expect(csvBuffer.toString()).toContain('email,firstName,lastName');
    });

    it('should export users as Excel', async () => {
      await utils.createTestUser({ email: 'user2@example.com' });

      const excelBuffer = await userService.exportData('xlsx');

      expect(excelBuffer).toBeDefined();
      expect(Buffer.isBuffer(excelBuffer)).toBe(true);
    });

    it('should throw error for unsupported format', async () => {
      await expect(userService.exportData('pdf')).rejects.toThrow(BadRequestError);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      await utils.createTestUser({ email: 'user2@example.com', role: 'ADMIN' });
      await utils.createTestUser({ email: 'user3@example.com', role: 'USER' });

      const stats = await userService.getUserStats();

      expect(stats).toBeDefined();
      expect(stats.totalUsers).toBeGreaterThan(0);
      expect(stats.activeUsers).toBeGreaterThan(0);
      expect(stats.deletedUsers).toBeDefined();
      expect(stats.roleDistribution).toBeDefined();
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const newRole = 'ADMIN';

      const updatedUser = await userService.updateUserRole(testUser._id.toString(), newRole);

      expect(updatedUser.role).toBe(newRole);
    });

    it('should throw error when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(userService.updateUserRole(fakeId, 'ADMIN')).rejects.toThrow(NotFoundError);
    });

    it('should throw error for invalid role', async () => {
      await expect(userService.updateUserRole(testUser._id.toString(), 'INVALID_ROLE')).rejects.toThrow(BadRequestError);
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      // First deactivate user
      await userService.update(testUser._id.toString(), { isActive: false });

      // Then activate
      const activatedUser = await userService.activateUser(testUser._id.toString());

      expect(activatedUser.isActive).toBe(true);
    });

    it('should throw error when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(userService.activateUser(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const deactivatedUser = await userService.deactivateUser(testUser._id.toString());

      expect(deactivatedUser.isActive).toBe(false);
    });

    it('should throw error when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(userService.deactivateUser(fakeId)).rejects.toThrow(NotFoundError);
    });
  });
});
