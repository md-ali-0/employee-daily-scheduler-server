import { UnauthorizedError } from '@core/error.classes'
import { AuthService } from '@modules/auth/auth.service'
import { testUtils } from '../../setup'

// Mock dependencies
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}))
jest.mock('@config/db', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
}))

describe('Auth Service', () => {
  let authService: AuthService
  let mockPrisma: any
  let mockBcrypt: any
  let mockJwt: any

  beforeEach(() => {
    authService = new AuthService()
    mockPrisma = require('@config/db')
    mockBcrypt = require('bcryptjs')
    mockJwt = require('jsonwebtoken')
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerInput = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      }
      const ipAddress = '127.0.0.1'
      const userAgent = 'Mozilla/5.0'

      // Mock that user doesn't exist
      mockPrisma.user.findUnique.mockResolvedValue(null)
      
      // Mock password hashing
      mockBcrypt.hash.mockResolvedValue('hashedPassword')
      
      // Mock user creation
      mockPrisma.user.create.mockResolvedValue(testUtils.mockUser)

      const result = await authService.register(registerInput, ipAddress, userAgent)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ 
        where: { email: registerInput.email } 
      })
      expect(mockBcrypt.hash).toHaveBeenCalledWith(registerInput.password, 10)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: registerInput.email,
          name: registerInput.name,
          password: 'hashedPassword',
        },
      })
      expect(result).toEqual(testUtils.mockUser)
    })

    it('should throw BadRequestError if user already exists', async () => {
      const registerInput = {
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'password123'
      }
      const ipAddress = '127.0.0.1'
      const userAgent = 'Mozilla/5.0'

      // Mock that user already exists
      mockPrisma.user.findUnique.mockResolvedValue(testUtils.mockUser)

      await expect(authService.register(registerInput, ipAddress, userAgent))
        .rejects.toThrow('User already exists')

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ 
        where: { email: registerInput.email } 
      })
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginInput = {
        email: 'test@example.com',
        password: 'password123'
      }
      const ipAddress = '127.0.0.1'
      const userAgent = 'Mozilla/5.0'

      const mockUser = { ...testUtils.mockUser, password: 'hashedPassword' }
      
      // Mock user lookup
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      
      // Mock password comparison
      mockBcrypt.compare.mockResolvedValue(true)
      
      // Mock JWT token generation
      mockJwt.sign.mockReturnValue('accessToken')

      const result = await authService.login(loginInput.email, loginInput.password, ipAddress, userAgent)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ 
        where: { email: loginInput.email } 
      })
      expect(mockBcrypt.compare).toHaveBeenCalledWith(loginInput.password, mockUser.password)
      expect(result).toHaveProperty('user', mockUser)
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('should throw UnauthorizedError if user not found', async () => {
      const loginInput = {
        email: 'nonexistent@example.com',
        password: 'password123'
      }
      const ipAddress = '127.0.0.1'
      const userAgent = 'Mozilla/5.0'

      // Mock that user doesn't exist
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(authService.login(loginInput.email, loginInput.password, ipAddress, userAgent))
        .rejects.toThrow(UnauthorizedError)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ 
        where: { email: loginInput.email } 
      })
      expect(mockBcrypt.compare).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedError if password is incorrect', async () => {
      const loginInput = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
      const ipAddress = '127.0.0.1'
      const userAgent = 'Mozilla/5.0'

      const mockUser = { ...testUtils.mockUser, password: 'hashedPassword' }
      
      // Mock user lookup
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      
      // Mock password comparison fails
      mockBcrypt.compare.mockResolvedValue(false)

      await expect(authService.login(loginInput.email, loginInput.password, ipAddress, userAgent))
        .rejects.toThrow(UnauthorizedError)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ 
        where: { email: loginInput.email } 
      })
      expect(mockBcrypt.compare).toHaveBeenCalledWith(loginInput.password, mockUser.password)
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockRefreshToken = 'valid-refresh-token'
      const mockUser = testUtils.mockUser

      // Mock JWT verification
      mockJwt.verify.mockReturnValue({ userId: mockUser.id } as any)
      
      // Mock user lookup
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      
      // Mock JWT token generation
      mockJwt.sign.mockReturnValue('newAccessToken')

      const result = await authService.refreshAccessToken(mockRefreshToken)

      expect(mockJwt.verify).toHaveBeenCalledWith(mockRefreshToken, expect.any(String))
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ 
        where: { id: mockUser.id } 
      })
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('newRefreshToken')
    })

    it('should throw UnauthorizedError if refresh token is invalid', async () => {
      const mockRefreshToken = 'invalid-refresh-token'

      // Mock JWT verification fails
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await expect(authService.refreshAccessToken(mockRefreshToken))
        .rejects.toThrow(UnauthorizedError)

      expect(mockJwt.verify).toHaveBeenCalledWith(mockRefreshToken, expect.any(String))
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedError if user not found', async () => {
      const mockRefreshToken = 'valid-refresh-token'
      const mockUserId = 'non-existent-user-id'

      // Mock JWT verification
      mockJwt.verify.mockReturnValue({ userId: mockUserId } as any)
      
      // Mock user lookup returns null
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(authService.refreshAccessToken(mockRefreshToken))
        .rejects.toThrow(UnauthorizedError)

      expect(mockJwt.verify).toHaveBeenCalledWith(mockRefreshToken, expect.any(String))
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ 
        where: { id: mockUserId } 
      })
    })
  })
})
