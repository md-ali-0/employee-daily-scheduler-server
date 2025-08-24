import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { BadRequestError, NotFoundError } from '../../../src/core/error.classes';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { utils } from '../../setup';

describe('AuthService', () => {
  let authService: AuthService;
  let testUser: any;

  beforeEach(async () => {
    authService = new AuthService();
    testUser = await utils.createTestUser();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'USER'
      };

      const user = await authService.register(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(userData.role);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should throw error when email already exists', async () => {
      const userData = {
        email: testUser.email, // Already exists
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      await expect(authService.register(userData)).rejects.toThrow(BadRequestError);
    });

    it('should hash password correctly', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = await authService.register(userData);
      const isPasswordValid = await bcrypt.compare(userData.password, user.password);

      expect(isPasswordValid).toBe(true);
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginData = {
        email: testUser.email,
        password: 'password123'
      };

      const result = await authService.login(loginData);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(testUser.email);
    });

    it('should throw error with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      await expect(authService.login(loginData)).rejects.toThrow(BadRequestError);
    });

    it('should throw error with invalid password', async () => {
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      await expect(authService.login(loginData)).rejects.toThrow(BadRequestError);
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', async () => {
      const token = await authService.generateToken(testUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBe(testUser._id.toString());
      expect(decoded.email).toBe(testUser.email);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const token = await authService.generateToken(testUser);
      const decoded = await authService.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testUser._id.toString());
      expect(decoded.email).toBe(testUser.email);
    });

    it('should throw error with invalid token', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(authService.verifyToken(invalidToken)).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const oldToken = await authService.generateToken(testUser);
      const newToken = await authService.refreshToken(oldToken);

      expect(newToken).toBeDefined();
      expect(typeof newToken).toBe('string');
      expect(newToken).not.toBe(oldToken);

      // Verify new token
      const decoded = jwt.verify(newToken, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBe(testUser._id.toString());
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token for existing user', async () => {
      const email = testUser.email;
      const result = await authService.forgotPassword(email);

      expect(result).toBeDefined();
      expect(result.resetToken).toBeDefined();
      expect(result.user.email).toBe(email);
    });

    it('should throw error for non-existent user', async () => {
      const email = 'nonexistent@example.com';

      await expect(authService.forgotPassword(email)).rejects.toThrow(NotFoundError);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      // First generate reset token
      const { resetToken } = await authService.forgotPassword(testUser.email);
      
      const newPassword = 'newpassword123';
      const result = await authService.resetPassword(resetToken, newPassword);

      expect(result).toBeDefined();
      expect(result.user.email).toBe(testUser.email);

      // Verify password was changed
      const updatedUser = await authService.findById(testUser._id.toString());
      const isPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should throw error with invalid token', async () => {
      const invalidToken = 'invalid-token';
      const newPassword = 'newpassword123';

      await expect(authService.resetPassword(invalidToken, newPassword)).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const oldPassword = 'password123';
      const newPassword = 'newpassword123';

      const result = await authService.changePassword(
        testUser._id.toString(),
        oldPassword,
        newPassword
      );

      expect(result).toBeDefined();
      expect(result.user.email).toBe(testUser.email);

      // Verify password was changed
      const updatedUser = await authService.findById(testUser._id.toString());
      const isPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should throw error with wrong old password', async () => {
      const wrongOldPassword = 'wrongpassword';
      const newPassword = 'newpassword123';

      await expect(
        authService.changePassword(testUser._id.toString(), wrongOldPassword, newPassword)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const user = await authService.findById(testUser._id.toString());

      expect(user).toBeDefined();
      expect(user._id.toString()).toBe(testUser._id.toString());
      expect(user.email).toBe(testUser.email);
    });

    it('should throw error when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(authService.findById(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const user = await authService.findByEmail(testUser.email);

      expect(user).toBeDefined();
      expect(user.email).toBe(testUser.email);
    });

    it('should return null when user not found', async () => {
      const user = await authService.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '1234567890'
      };

      const updatedUser = await authService.updateProfile(testUser._id.toString(), updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser.firstName).toBe(updateData.firstName);
      expect(updatedUser.lastName).toBe(updateData.lastName);
      expect(updatedUser.phone).toBe(updateData.phone);
    });

    it('should throw error when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updateData = { firstName: 'Updated' };

      await expect(authService.updateProfile(fakeId, updateData)).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account successfully', async () => {
      await expect(authService.deleteAccount(testUser._id.toString())).resolves.not.toThrow();

      // Verify user is deleted
      await expect(authService.findById(testUser._id.toString())).rejects.toThrow(NotFoundError);
    });

    it('should throw error when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(authService.deleteAccount(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const isValid = await authService.validatePassword(testUser, 'password123');

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await authService.validatePassword(testUser, 'wrongpassword');

      expect(isValid).toBe(false);
    });
  });
});
