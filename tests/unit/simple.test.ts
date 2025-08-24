import mongoose from 'mongoose';
import { utils } from '../setup';

describe('Simple Test Suite', () => {
  it('should connect to test database', () => {
    expect(mongoose.connection.readyState).toBe(1); // Connected
  });

  it('should create a test user', async () => {
    const user = await utils.createTestUser({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.firstName).toBe('Test');
    expect(user.lastName).toBe('User');
  });

  it('should create a test employee', async () => {
    const employee = await utils.createTestEmployee({
      name: 'Test Employee',
      email: 'employee@example.com',
      role: 'DEVELOPER'
    });

    expect(employee).toBeDefined();
    expect(employee.name).toBe('Test Employee');
    expect(employee.email).toBe('employee@example.com');
    expect(employee.role).toBe('DEVELOPER');
  });

  it('should create a test shift', async () => {
    const shift = await utils.createTestShift({
      date: new Date(),
      startTime: '09:00',
      endTime: '17:00',
      role: 'DEVELOPER'
    });

    expect(shift).toBeDefined();
    expect(shift.startTime).toBe('09:00');
    expect(shift.endTime).toBe('17:00');
    expect(shift.role).toBe('DEVELOPER');
  });

  it('should generate test token', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const token = utils.generateTestToken(userId, 'USER');

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should mock request and response objects', () => {
    const req = utils.mockRequest({ body: { test: 'data' } });
    const res = utils.mockResponse();
    const next = utils.mockNext;

    expect(req.body).toEqual({ test: 'data' });
    expect(res.status).toBeDefined();
    expect(res.json).toBeDefined();
    expect(typeof next).toBe('function');
  });
}); 