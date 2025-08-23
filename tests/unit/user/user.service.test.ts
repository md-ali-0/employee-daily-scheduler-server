import { UserService } from '@modules/user/user.service'
import { testUtils } from '../../setup'

// Mock PrismaClient constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  })),
}))

// Mock dependencies
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

describe('User Service', () => {
  let userService: UserService
  let mockPrisma: any

  beforeEach(() => {
    userService = new UserService()
    mockPrisma = require('@prisma/client').PrismaClient.mock.results[0].value
    jest.clearAllMocks()
  })

  describe('findById', () => {
    it('should return user by ID successfully', async () => {
      const userId = 'test-user-id'
      mockPrisma.user.findUnique.mockResolvedValue(testUtils.mockUser)

      const result = await userService.findById(userId)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      })
      expect(result).toEqual(testUtils.mockUser)
    })

    it('should return null if user not found', async () => {
      const userId = 'non-existent-id'
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await userService.findById(userId)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      })
      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [testUtils.mockUser, testUtils.mockAdminUser]
      mockPrisma.user.findMany.mockResolvedValue(users)

      const result = await userService.findAll()

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith()
      expect(result).toEqual(users)
    })
  })

  describe('getAll', () => {
    it('should return all active users by default', async () => {
      const users = [testUtils.mockUser, testUtils.mockAdminUser]
      mockPrisma.user.findMany.mockResolvedValue(users)
      mockPrisma.user.count.mockResolvedValue(2)

      const result = await userService.getAll()

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
      expect(result.data).toEqual(users)
      expect(result.pagination).toBeDefined()
    })

    it('should return all users including deleted when delete filter is YES', async () => {
      const users = [testUtils.mockUser, testUtils.mockAdminUser]
      mockPrisma.user.findMany.mockResolvedValue(users)
      mockPrisma.user.count.mockResolvedValue(2)

      const result = await userService.getAll({ delete: 'YES' })

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
      expect(result.data).toEqual(users)
      expect(result.pagination).toBeDefined()
    })
  })

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
        role: 'USER' as const,
      }

      mockPrisma.user.create.mockResolvedValue(testUtils.mockUser)

      const result = await userService.createUser(userData)

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: userData,
      })
      expect(result).toEqual(testUtils.mockUser)
    })
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = 'test-user-id'
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      }

      mockPrisma.user.update.mockResolvedValue({ ...testUtils.mockUser, ...updateData })

      const result = await userService.updateUser(userId, updateData)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      })
      expect(result).toEqual({ ...testUtils.mockUser, ...updateData })
    })
  })

  describe('softDeleteUser', () => {
    it('should soft delete user successfully', async () => {
      const userId = 'test-user-id'

      mockPrisma.user.update.mockResolvedValue({ ...testUtils.mockUser, deletedAt: new Date() })

      const result = await userService.softDeleteUser(userId)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { deletedAt: expect.any(Date) },
      })
      expect(result).toEqual({ ...testUtils.mockUser, deletedAt: expect.any(Date) })
    })
  })

  describe('restore', () => {
    it('should restore user successfully', async () => {
      const userId = 'test-user-id'

      mockPrisma.user.update.mockResolvedValue({ ...testUtils.mockUser, deletedAt: null })

      const result = await userService.restore(userId)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { deletedAt: null },
      })
      expect(result).toEqual({ ...testUtils.mockUser, deletedAt: null })
    })
  })

  describe('hardDelete', () => {
    it('should hard delete user successfully', async () => {
      const userId = 'test-user-id'

      mockPrisma.user.delete.mockResolvedValue(testUtils.mockUser)

      const result = await userService.hardDelete(userId)

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      })
      expect(result).toEqual(testUtils.mockUser)
    })
  })

  describe('bulkSoftDelete', () => {
    it('should soft delete multiple users successfully', async () => {
      const userIds = ['user-1', 'user-2', 'user-3']

      mockPrisma.user.updateMany.mockResolvedValue({ count: 3 })

      const result = await userService.bulkSoftDelete(userIds)

      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: { in: userIds } },
        data: { deletedAt: expect.any(Date) },
      })
      expect(result).toEqual({ count: 3 })
    })
  })

  describe('bulkHardDelete', () => {
    it('should hard delete multiple users successfully', async () => {
      const userIds = ['user-1', 'user-2', 'user-3']

      mockPrisma.user.deleteMany.mockResolvedValue({ count: 3 })

      const result = await userService.bulkHardDelete(userIds)

      expect(mockPrisma.user.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: userIds } },
      })
      expect(result).toEqual({ count: 3 })
    })
  })

  describe('exportData', () => {
    it('should export user data as JSON buffer', async () => {
      const users = [testUtils.mockUser, testUtils.mockAdminUser]
      mockPrisma.user.findMany.mockResolvedValue(users)

      const result = await userService.exportData('json')

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith()
      expect(result).toBeInstanceOf(Buffer)
      const exportedData = JSON.parse(result.toString())
      expect(exportedData).toHaveLength(users.length)
      expect(exportedData[0]).toHaveProperty('id', users[0].id)
      expect(exportedData[0]).toHaveProperty('email', users[0].email)
    })
  })
})
