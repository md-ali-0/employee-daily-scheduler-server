import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../src/app';
import { utils } from '../setup';

describe('Schedule Integration Tests', () => {
  let authToken: string;
  let testUser: any;
  let testEmployee: any;

  beforeAll(async () => {
    testUser = await utils.createTestUser({ role: 'ADMIN' });
    testEmployee = await utils.createTestEmployee();
    authToken = utils.generateTestToken(testUser._id.toString(), testUser.role);
  });

  describe('POST /api/v1/schedule/shifts', () => {
    it('should create a new shift', async () => {
      const shiftData = {
        date: '2024-01-01T00:00:00.000Z',
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript', 'TypeScript'],
        location: 'Office',
        minEmployees: 1,
        maxEmployees: 3
      };

      const response = await request(app)
        .post('/api/v1/schedule/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shiftData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.role).toBe(shiftData.role);
      expect(response.body.data.status).toBe('OPEN');
    });

    it('should return 400 for invalid shift data', async () => {
      const invalidShiftData = {
        date: 'invalid-date',
        startTime: '9:00', // Invalid format
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office'
      };

      await request(app)
        .post('/api/v1/schedule/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidShiftData)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const shiftData = {
        date: '2024-01-01T00:00:00.000Z',
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office'
      };

      await request(app)
        .post('/api/v1/schedule/shifts')
        .send(shiftData)
        .expect(401);
    });
  });

  describe('GET /api/v1/schedule/shifts', () => {
    it('should return paginated shifts', async () => {
      const response = await request(app)
        .get('/api/v1/schedule/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter shifts by location', async () => {
      const response = await request(app)
        .get('/api/v1/schedule/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ location: 'Office' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/schedule/shifts/:id', () => {
    it('should return a specific shift', async () => {
      // First create a shift
      const shiftData = {
        date: '2024-01-01T00:00:00.000Z',
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office'
      };

      const createResponse = await request(app)
        .post('/api/v1/schedule/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shiftData);

      const shiftId = createResponse.body.data._id;

      const response = await request(app)
        .get(`/api/v1/schedule/shifts/${shiftId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(shiftId);
    });

    it('should return 404 for non-existent shift', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await request(app)
        .get(`/api/v1/schedule/shifts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/schedule/shifts/:id', () => {
    it('should update a shift', async () => {
      // First create a shift
      const shiftData = {
        date: '2024-01-01T00:00:00.000Z',
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office'
      };

      const createResponse = await request(app)
        .post('/api/v1/schedule/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shiftData);

      const shiftId = createResponse.body.data._id;

      const updateData = {
        startTime: '10:00',
        endTime: '18:00',
        notes: 'Updated shift'
      };

      const response = await request(app)
        .put(`/api/v1/schedule/shifts/${shiftId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.startTime).toBe(updateData.startTime);
      expect(response.body.data.endTime).toBe(updateData.endTime);
      expect(response.body.data.notes).toBe(updateData.notes);
    });
  });

  describe('DELETE /api/v1/schedule/shifts/:id', () => {
    it('should delete a shift', async () => {
      // First create a shift
      const shiftData = {
        date: '2024-01-01T00:00:00.000Z',
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office'
      };

      const createResponse = await request(app)
        .post('/api/v1/schedule/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shiftData);

      const shiftId = createResponse.body.data._id;

      await request(app)
        .delete(`/api/v1/schedule/shifts/${shiftId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify shift is deleted
      await request(app)
        .get(`/api/v1/schedule/shifts/${shiftId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/schedule/shifts/:shiftId/assign/:employeeId', () => {
    it('should assign employee to shift', async () => {
      // First create a shift
      const shiftData = {
        date: '2024-01-01T00:00:00.000Z',
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office',
        maxEmployees: 2
      };

      const createResponse = await request(app)
        .post('/api/v1/schedule/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shiftData);

      const shiftId = createResponse.body.data._id;

      const response = await request(app)
        .post(`/api/v1/schedule/shifts/${shiftId}/assign/${testEmployee._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.shiftId).toBe(shiftId);
      expect(response.body.data.employeeId).toBe(testEmployee._id.toString());
    });
  });

  describe('DELETE /api/v1/schedule/shifts/:shiftId/assign/:employeeId', () => {
    it('should remove employee from shift', async () => {
      // First create a shift and assign employee
      const shiftData = {
        date: '2024-01-01T00:00:00.000Z',
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office'
      };

      const createResponse = await request(app)
        .post('/api/v1/schedule/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shiftData);

      const shiftId = createResponse.body.data._id;

      // Assign employee
      await request(app)
        .post(`/api/v1/schedule/shifts/${shiftId}/assign/${testEmployee._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Remove employee
      await request(app)
        .delete(`/api/v1/schedule/shifts/${shiftId}/assign/${testEmployee._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('POST /api/v1/schedule/time-off', () => {
    it('should create time-off request', async () => {
      const requestData = {
        employeeId: testEmployee._id.toString(),
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-02T00:00:00.000Z',
        type: 'VACATION',
        reason: 'Annual leave'
      };

      const response = await request(app)
        .post('/api/v1/schedule/time-off')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.type).toBe('VACATION');
      expect(response.body.data.status).toBe('PENDING');
    });
  });

  describe('GET /api/v1/schedule/time-off', () => {
    it('should return time-off requests', async () => {
      const response = await request(app)
        .get('/api/v1/schedule/time-off')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('PUT /api/v1/schedule/time-off/:id/approve', () => {
    it('should approve time-off request', async () => {
      // First create a time-off request
      const requestData = {
        employeeId: testEmployee._id.toString(),
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-02T00:00:00.000Z',
        type: 'VACATION',
        reason: 'Annual leave'
      };

      const createResponse = await request(app)
        .post('/api/v1/schedule/time-off')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      const requestId = createResponse.body.data._id;

      const response = await request(app)
        .put(`/api/v1/schedule/time-off/${requestId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('APPROVED');
    });
  });

  describe('PUT /api/v1/schedule/time-off/:id/reject', () => {
    it('should reject time-off request', async () => {
      // First create a time-off request
      const requestData = {
        employeeId: testEmployee._id.toString(),
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-02T00:00:00.000Z',
        type: 'VACATION',
        reason: 'Annual leave'
      };

      const createResponse = await request(app)
        .post('/api/v1/schedule/time-off')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData);

      const requestId = createResponse.body.data._id;

      const response = await request(app)
        .put(`/api/v1/schedule/time-off/${requestId}/reject`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('REJECTED');
    });
  });

  describe('GET /api/v1/schedule/daily-schedule', () => {
    it('should return daily schedule', async () => {
      const response = await request(app)
        .get('/api/v1/schedule/daily-schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date: '2024-01-01' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 400 when date is missing', async () => {
      await request(app)
        .get('/api/v1/schedule/daily-schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/v1/schedule/coverage', () => {
    it('should return coverage analytics', async () => {
      const response = await request(app)
        .get('/api/v1/schedule/coverage')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date: '2024-01-01' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/schedule/workload/:employeeId', () => {
    it('should return employee workload', async () => {
      const response = await request(app)
        .get(`/api/v1/schedule/workload/${testEmployee._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-07T00:00:00.000Z'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 400 when dates are missing', async () => {
      await request(app)
        .get(`/api/v1/schedule/workload/${testEmployee._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/v1/schedule/conflicts/:employeeId', () => {
    it('should return employee conflicts', async () => {
      const response = await request(app)
        .get(`/api/v1/schedule/conflicts/${testEmployee._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /api/v1/schedule/templates', () => {
    it('should create recurring template', async () => {
      const templateData = {
        name: 'Weekly Development',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office'
      };

      const response = await request(app)
        .post('/api/v1/schedule/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(templateData.name);
    });
  });

  describe('GET /api/v1/schedule/templates', () => {
    it('should return recurring templates', async () => {
      const response = await request(app)
        .get('/api/v1/schedule/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /api/v1/schedule/templates/:templateId/generate', () => {
    it('should generate shifts from template', async () => {
      // First create a template
      const templateData = {
        name: 'Weekly Development',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office'
      };

      const createResponse = await request(app)
        .post('/api/v1/schedule/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      const templateId = createResponse.body.data._id;

      const response = await request(app)
        .post(`/api/v1/schedule/templates/${templateId}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-07T00:00:00.000Z'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 400 when dates are missing', async () => {
      const templateId = new mongoose.Types.ObjectId().toString();

      await request(app)
        .post(`/api/v1/schedule/templates/${templateId}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
}); 