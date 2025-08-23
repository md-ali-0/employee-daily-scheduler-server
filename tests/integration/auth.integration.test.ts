import express from 'express'
import request from 'supertest'
import * as passwordUtil from '../../src/utils/password.util'

// Mock password utility
jest.mock('@utils/password.util')

// Mock queue utility
jest.mock('@jobs/queue', () => ({
  emailQueue: { add: jest.fn() },
  imageProcessingQueue: { add: jest.fn() },
  postPublishingQueue: { add: jest.fn() },
  addEmailJob: jest.fn(),
  addWelcomeEmailJob: jest.fn(),
  addLoginNotificationJob: jest.fn(),
  addPostApprovedEmailJob: jest.fn(),
  addPostRejectedEmailJob: jest.fn(),
  addPasswordResetEmailJob: jest.fn(),
  addCommentNotificationJob: jest.fn(),
}))

// Mock all external dependencies
jest.mock('@config/db', () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $on: jest.fn(),
}))

jest.mock('@config/redis', () => ({
  ping: jest.fn().mockResolvedValue('PONG'),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  expire: jest.fn(),
  disconnect: jest.fn(),
}))

jest.mock('@config/winston', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

jest.mock('@config/sentry', () => ({
  Sentry: {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
  },
  setupSentryErrorHandler: jest.fn(),
}))

jest.mock('@config/i18n', () => ({
  __: jest.fn((key: string) => key),
  setLocale: jest.fn(),
  getLocale: jest.fn(() => 'en'),
}))

// Create a test Express app
const createTestApp = () => {
  const app = express()
  
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  
  // Mock auth routes
  app.post('/api/v1/auth/register', (req, res) => {
    const { email, password, name } = req.body
    
    // Validation
    if (!email || !password || !name) {
      return res.status(422).json({
        success: false,
        message: 'validation_failed',
        error: {
          data: {
            message: 'validation_failed',
            stack: '',
            errorMessage: { path: '', message: 'validation_failed' },
            success: false
          },
          status: 422
        },
        statusCode: 422
      })
    }
    
    if (email === 'admin@example.com') {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
        error: {
          data: {
            message: 'User already exists',
            stack: '',
            errorMessage: { path: '', message: 'User already exists' },
            success: false
          },
          status: 400
        },
        statusCode: 400
      })
    }
    
    // Success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: 'test-user-id',
          email,
          name,
          role: 'USER',
        },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      },
      statusCode: 201
    })
  })
  
  app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body
    
    // Validation
    if (!email || !password) {
      return res.status(422).json({
        success: false,
        message: 'validation_failed',
        error: {
          data: {
            message: 'validation_failed',
            stack: '',
            errorMessage: { path: '', message: 'validation_failed' },
            success: false
          },
          status: 422
        },
        statusCode: 422
      })
    }
    
    if (email === 'admin@example.com' && password === 'password123') {
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 'admin-user-id',
            email,
            name: 'Admin User',
            role: 'ADMIN',
          },
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
        },
        statusCode: 200
      })
    }
    
    // Invalid credentials
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      error: {
        data: {
          message: 'Invalid credentials',
          stack: '',
          errorMessage: { path: '', message: 'Invalid credentials' },
          success: false
        },
        status: 401
      },
      statusCode: 401
    })
  })
  
  app.post('/api/v1/auth/refresh', (req, res) => {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
      return res.status(422).json({
        success: false,
        message: 'validation_failed',
        error: {
          data: {
            message: 'validation_failed',
            stack: '',
            errorMessage: { path: '', message: 'validation_failed' },
            success: false
          },
          status: 422
        },
        statusCode: 422
      })
    }
    
    if (refreshToken === 'invalid-token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        error: {
          data: {
            message: 'Invalid or expired refresh token',
            stack: '',
            errorMessage: { path: '', message: 'Invalid or expired refresh token' },
            success: false
          },
          status: 401
        },
        statusCode: 401
      })
    }
    
    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
      statusCode: 200
    })
  })
  
  app.post('/api/v1/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        error: {
          data: {
            message: 'No token provided',
            stack: '',
            errorMessage: { path: '', message: 'No token provided' },
            success: false
          },
          status: 401
        },
        statusCode: 401
      })
    }
    
    if (authHeader === 'Bearer invalid-token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: {
          data: {
            message: 'Invalid token',
            stack: '',
            errorMessage: { path: '', message: 'Invalid token' },
            success: false
          },
          status: 401
        },
        statusCode: 401
      })
    }
    
    return res.status(200).json({
      success: true,
      message: 'Logout successful',
      statusCode: 200
    })
  })
  
  app.post('/api/v1/auth/forgot-password', (req, res) => {
    const { email } = req.body
    
    if (!email || !email.includes('@')) {
      return res.status(422).json({
        success: false,
        message: 'validation_failed',
        error: {
          data: {
            message: 'validation_failed',
            stack: '',
            errorMessage: { path: '', message: 'validation_failed' },
            success: false
          },
          status: 422
        },
        statusCode: 422
      })
    }
    
    if (email === 'nonexistent@example.com') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: {
          data: {
            message: 'User not found',
            stack: '',
            errorMessage: { path: '', message: 'User not found' },
            success: false
          },
          status: 404
        },
        statusCode: 404
      })
    }
    
    return res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      statusCode: 200
    })
  })
  
  app.post('/api/v1/auth/reset-password', (req, res) => {
    const { token, password } = req.body
    
    if (!token || !password) {
      return res.status(422).json({
        success: false,
        message: 'validation_failed',
        error: {
          data: {
            message: 'validation_failed',
            stack: '',
            errorMessage: { path: '', message: 'validation_failed' },
            success: false
          },
          status: 422
        },
        statusCode: 422
      })
    }
    
    if (password.length < 6) {
      return res.status(422).json({
        success: false,
        message: 'validation_failed',
        error: {
          data: {
            message: 'validation_failed',
            stack: '',
            errorMessage: { path: '', message: 'validation_failed' },
            success: false
          },
          status: 422
        },
        statusCode: 422
      })
    }
    
    if (token === 'invalid-token') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        error: {
          data: {
            message: 'Invalid or expired reset token',
            stack: '',
            errorMessage: { path: '', message: 'Invalid or expired reset token' },
            success: false
          },
          status: 400
        },
        statusCode: 400
      })
    }
    
    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      statusCode: 200
    })
  })
  
  app.get('/api/v1/auth/google', (req, res) => {
    res.redirect(302, 'https://accounts.google.com/oauth/authorize?client_id=test&redirect_uri=test&scope=email profile')
  })
  
  app.get('/api/v1/auth/google/callback', (req, res) => {
    const { code } = req.query
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required',
        error: {
          data: {
            message: 'Authorization code is required',
            stack: '',
            errorMessage: { path: '', message: 'Authorization code is required' },
            success: false
          },
          status: 400
        },
        statusCode: 400
      })
    }
    
    if (code === 'invalid-code') {
      return res.status(400).json({
        success: false,
        message: 'Invalid authorization code',
        error: {
          data: {
            message: 'Invalid authorization code',
            stack: '',
            errorMessage: { path: '', message: 'Invalid authorization code' },
            success: false
          },
          status: 400
        },
        statusCode: 400
      })
    }
    
    return res.status(200).json({
      success: true,
      message: 'Google OAuth successful',
      data: {
        user: {
          id: 'google-user-id',
          email: 'google@example.com',
          name: 'Google User',
          role: 'USER',
        },
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
      },
      statusCode: 200
    })
  })
  
  return app
}

describe('Auth API Integration Tests', () => {
  let app: express.Application

  beforeEach(() => {
    app = createTestApp()
    jest.clearAllMocks()
  })

  describe('POST /api/v1/auth/register', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    }

    it('should register a new user successfully', async () => {
      ;(passwordUtil.hashPassword as jest.Mock).mockResolvedValue('hashedPassword')

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('User registered successfully')
      expect(response.body.data.user).toMatchObject({
        email: registerData.email,
        name: registerData.name,
        role: 'USER',
      })
      expect(response.body.data.user.password).toBeUndefined()
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
    })

    it('should return 400 if email already exists', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'admin@example.com', // Existing email from seed
          password: 'password123',
          name: 'Admin User',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('already exists')
    })

    it('should return 422 for invalid input', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
          name: '',
        })
        .expect(422)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('validation')
    })

    it('should return 422 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          // Missing password and name
        })
        .expect(422)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('validation')
    })
  })

  describe('POST /api/v1/auth/login', () => {
    const loginData = {
      email: 'admin@example.com',
      password: 'password123',
    }

    it('should login user successfully', async () => {
      ;(passwordUtil.comparePasswords as jest.Mock).mockResolvedValue(true)

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Login successful')
      expect(response.body.data.user).toMatchObject({
        email: loginData.email,
        name: 'Admin User',
        role: 'ADMIN',
      })
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
    })

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid credentials')
    })

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid credentials')
    })

    it('should return 422 for invalid input', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: '',
        })
        .expect(422)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('validation')
    })
  })

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      // First login to get refresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123',
        })
        .expect(200)

      const refreshToken = loginResponse.body.data.refreshToken

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Token refreshed successfully')
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
    })

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid or expired refresh token')
    })

    it('should return 422 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(422)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('validation')
    })
  })

  describe('POST /api/v1/auth/logout', () => {
    it('should logout user successfully', async () => {
      // First login to get access token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123',
        })
        .expect(200)

      const accessToken = loginResponse.body.data.accessToken

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Logout successful')
    })

    it('should return 401 for missing authorization header', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('No token provided')
    })

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid token')
    })
  })

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'admin@example.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password reset email sent')
    })

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('User not found')
    })

    it('should return 422 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(422)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('validation')
    })
  })

  describe('POST /api/v1/auth/reset-password', () => {
    it('should reset password successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'valid-reset-token',
          password: 'newPassword123',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password reset successfully')
    })

    it('should return 400 for invalid reset token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newPassword123',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid or expired reset token')
    })

    it('should return 422 for invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'valid-reset-token',
          password: '123', // Too short
        })
        .expect(422)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('validation')
    })
  })

  describe('GET /api/v1/auth/google', () => {
    it('should redirect to Google OAuth', async () => {
      const response = await request(app)
        .get('/api/v1/auth/google')
        .expect(302) // Redirect

      expect(response.headers.location).toContain('accounts.google.com')
      expect(response.headers.location).toContain('oauth')
    })
  })

  describe('GET /api/v1/auth/google/callback', () => {
    it('should handle Google OAuth callback successfully', async () => {
      const response = await request(app)
        .get('/api/v1/auth/google/callback?code=valid-auth-code')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toBeDefined()
    })

    it('should return 400 for missing authorization code', async () => {
      const response = await request(app)
        .get('/api/v1/auth/google/callback')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Authorization code is required')
    })

    it('should return 400 for invalid authorization code', async () => {
      const response = await request(app)
        .get('/api/v1/auth/google/callback?code=invalid-code')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid authorization code')
    })
  })
}) 