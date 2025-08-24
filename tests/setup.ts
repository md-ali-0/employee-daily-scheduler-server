import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: '.env.test' });

let mongod: MongoMemoryServer;

// Global test setup
beforeAll(async () => {
  // Start in-memory MongoDB
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  
  // Connect to test database
  await mongoose.connect(mongoUri);
  
  console.log('Test environment initialized');
});

// Global test teardown
afterAll(async () => {
  // Disconnect from MongoDB
  await mongoose.disconnect();
  await mongod.stop();
  
  console.log('Test environment cleaned up');
});

// Clean up after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.STORAGE_TYPE = 'LOCAL';
process.env.SENTRY_DSN = '';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

// Global test utilities
export const testUtils = {
  // Create a test user
  createTestUser: async (userData: any = {}) => {
    const UserModel = mongoose.model('User');
    const defaultUser = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      ...userData
    };
    return await UserModel.create(defaultUser);
  },

  // Create a test employee
  createTestEmployee: async (employeeData: any = {}) => {
    const EmployeeModel = mongoose.model('Employee');
    const defaultEmployee = {
      name: 'Test Employee',
      email: 'employee@example.com',
      role: 'DEVELOPER',
      department: 'Engineering',
      ...employeeData
    };
    return await EmployeeModel.create(defaultEmployee);
  },

  // Create a test shift
  createTestShift: async (shiftData: any = {}) => {
    const ShiftModel = mongoose.model('Shift');
    const defaultShift = {
      date: new Date(),
      startTime: '09:00',
      endTime: '17:00',
      role: 'DEVELOPER',
      skills: ['JavaScript', 'TypeScript'],
      location: 'Office',
      minEmployees: 1,
      maxEmployees: 3,
      status: 'OPEN',
      ...shiftData
    };
    return await ShiftModel.create(defaultShift);
  },

  // Generate JWT token for testing
  generateTestToken: (userId: string, role: string = 'USER') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: userId, email: 'test@example.com', role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },

  // Mock request object
  mockRequest: (data: any = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    t: (key: string) => key, // Mock i18n function
    ...data
  }),

  // Mock response object
  mockResponse: () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },

  // Mock next function
  mockNext: jest.fn()
};

// Export for use in tests
export { testUtils as utils };

