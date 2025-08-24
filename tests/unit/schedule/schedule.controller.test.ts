import mongoose from 'mongoose';
import { BadRequestError } from '../../../src/core/error.classes';
import { ScheduleController } from '../../../src/modules/schedule/schedule.controller';
import { utils } from '../../setup';

// Mock the service
jest.mock('../../../src/modules/schedule/schedule.service');

describe('ScheduleController', () => {
  let scheduleController: ScheduleController;
  let mockScheduleService: any;
  let testUser: any;
  let testEmployee: any;

  beforeEach(async () => {
    testUser = await utils.createTestUser();
    testEmployee = await utils.createTestEmployee();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Create controller instance
    scheduleController = new ScheduleController();
    
    // Get the mocked service
    mockScheduleService = (scheduleController as any).scheduleService;
  });

  describe('createShift', () => {
    it('should create a shift successfully', async () => {
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

      const mockShift = {
        _id: new mongoose.Types.ObjectId(),
        ...shiftData,
        date: new Date(shiftData.date),
        status: 'OPEN'
      };

      mockScheduleService.createShift.mockResolvedValue(mockShift);

      const req = utils.mockRequest({
        body: shiftData,
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.createShift(req, res, next);

      expect(mockScheduleService.createShift).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.any(Date),
          startTime: shiftData.startTime,
          endTime: shiftData.endTime
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'schedule.shift_created',
        data: mockShift
      });
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        date: 'invalid-date',
        startTime: '9:00', // Invalid format
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office'
      };

      mockScheduleService.createShift.mockRejectedValue(new BadRequestError('Invalid data'));

      const req = utils.mockRequest({
        body: invalidData,
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.createShift(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('updateShift', () => {
    it('should update a shift successfully', async () => {
      const shiftId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        startTime: '10:00',
        endTime: '18:00',
        notes: 'Updated shift'
      };

      const mockUpdatedShift = {
        _id: shiftId,
        ...updateData,
        status: 'OPEN'
      };

      mockScheduleService.updateShift.mockResolvedValue(mockUpdatedShift);

      const req = utils.mockRequest({
        params: { id: shiftId },
        body: updateData,
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.updateShift(req, res, next);

      expect(mockScheduleService.updateShift).toHaveBeenCalledWith(shiftId, updateData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'schedule.shift_updated',
        data: mockUpdatedShift
      });
    });
  });

  describe('deleteShift', () => {
    it('should delete a shift successfully', async () => {
      const shiftId = new mongoose.Types.ObjectId().toString();

      mockScheduleService.deleteShift.mockResolvedValue(undefined);

      const req = utils.mockRequest({
        params: { id: shiftId },
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.deleteShift(req, res, next);

      expect(mockScheduleService.deleteShift).toHaveBeenCalledWith(shiftId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'schedule.shift_deleted'
      });
    });
  });

  describe('getShift', () => {
    it('should get a shift by id', async () => {
      const shiftId = new mongoose.Types.ObjectId().toString();
      const mockShift = {
        _id: shiftId,
        date: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER'
      };

      mockScheduleService.findById.mockResolvedValue(mockShift);

      const req = utils.mockRequest({
        params: { id: shiftId },
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.getShift(req, res, next);

      expect(mockScheduleService.findById).toHaveBeenCalledWith(shiftId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockShift
      });
    });
  });

  describe('getShifts', () => {
    it('should get paginated shifts', async () => {
      const mockShifts = {
        data: [
          { _id: new mongoose.Types.ObjectId(), role: 'DEVELOPER' },
          { _id: new mongoose.Types.ObjectId(), role: 'DESIGNER' }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      };

      mockScheduleService.getAll.mockResolvedValue(mockShifts);

      const req = utils.mockRequest({
        query: { page: '1', limit: '10' },
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.getShifts(req, res, next);

      expect(mockScheduleService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockShifts
      });
    });
  });

  describe('assignEmployeeToShift', () => {
    it('should assign employee to shift successfully', async () => {
      const shiftId = new mongoose.Types.ObjectId().toString();
      const employeeId = testEmployee._id.toString();

      const mockAssignment = {
        _id: new mongoose.Types.ObjectId(),
        shiftId,
        employeeId,
        status: 'ASSIGNED'
      };

      mockScheduleService.assignEmployeeToShift.mockResolvedValue(mockAssignment);

      const req = utils.mockRequest({
        params: { shiftId, employeeId },
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.assignEmployeeToShift(req, res, next);

      expect(mockScheduleService.assignEmployeeToShift).toHaveBeenCalledWith(
        shiftId,
        employeeId,
        testUser.id
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'schedule.employee_assigned',
        data: mockAssignment
      });
    });
  });

  describe('removeEmployeeFromShift', () => {
    it('should remove employee from shift successfully', async () => {
      const shiftId = new mongoose.Types.ObjectId().toString();
      const employeeId = testEmployee._id.toString();

      mockScheduleService.removeEmployeeFromShift.mockResolvedValue(undefined);

      const req = utils.mockRequest({
        params: { shiftId, employeeId },
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.removeEmployeeFromShift(req, res, next);

      expect(mockScheduleService.removeEmployeeFromShift).toHaveBeenCalledWith(shiftId, employeeId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'schedule.employee_removed'
      });
    });
  });

  describe('createTimeOffRequest', () => {
    it('should create time-off request successfully', async () => {
      const requestData = {
        employeeId: testEmployee._id.toString(),
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-02T00:00:00.000Z',
        type: 'VACATION',
        reason: 'Annual leave'
      };

      const mockRequest = {
        _id: new mongoose.Types.ObjectId(),
        ...requestData,
        status: 'PENDING'
      };

      mockScheduleService.createTimeOffRequest.mockResolvedValue(mockRequest);

      const req = utils.mockRequest({
        body: requestData,
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.createTimeOffRequest(req, res, next);

      expect(mockScheduleService.createTimeOffRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: expect.any(mongoose.Types.ObjectId),
          startDate: expect.any(Date),
          endDate: expect.any(Date)
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'schedule.time_off_requested',
        data: mockRequest
      });
    });
  });

  describe('approveTimeOffRequest', () => {
    it('should approve time-off request successfully', async () => {
      const requestId = new mongoose.Types.ObjectId().toString();

      const mockApprovedRequest = {
        _id: requestId,
        status: 'APPROVED',
        approvedBy: testUser.id
      };

      mockScheduleService.approveTimeOffRequest.mockResolvedValue(mockApprovedRequest);

      const req = utils.mockRequest({
        params: { id: requestId },
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.approveTimeOffRequest(req, res, next);

      expect(mockScheduleService.approveTimeOffRequest).toHaveBeenCalledWith(
        requestId,
        testUser.id
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'schedule.time_off_approved',
        data: mockApprovedRequest
      });
    });
  });

  describe('rejectTimeOffRequest', () => {
    it('should reject time-off request successfully', async () => {
      const requestId = new mongoose.Types.ObjectId().toString();

      const mockRejectedRequest = {
        _id: requestId,
        status: 'REJECTED',
        approvedBy: testUser.id
      };

      mockScheduleService.rejectTimeOffRequest.mockResolvedValue(mockRejectedRequest);

      const req = utils.mockRequest({
        params: { id: requestId },
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.rejectTimeOffRequest(req, res, next);

      expect(mockScheduleService.rejectTimeOffRequest).toHaveBeenCalledWith(
        requestId,
        testUser.id
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'schedule.time_off_rejected',
        data: mockRejectedRequest
      });
    });
  });

  describe('getDailySchedule', () => {
    it('should get daily schedule successfully', async () => {
      const date = '2024-01-01';
      const location = 'Office';
      const team = 'Engineering';

      const mockSchedule = [
        { _id: new mongoose.Types.ObjectId(), role: 'DEVELOPER' }
      ];

      mockScheduleService.getDailySchedule.mockResolvedValue(mockSchedule);

      const req = utils.mockRequest({
        query: { date, location, team },
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.getDailySchedule(req, res, next);

      expect(mockScheduleService.getDailySchedule).toHaveBeenCalledWith(
        expect.any(Date),
        location,
        team
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSchedule
      });
    });

    it('should throw error when date is missing', async () => {
      const req = utils.mockRequest({
        query: { location: 'Office' },
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.getDailySchedule(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('getCoverageAnalytics', () => {
    it('should get coverage analytics successfully', async () => {
      const date = '2024-01-01';
      const location = 'Office';

      const mockAnalytics = [
        { location: 'Office', coverage: 85 }
      ];

      mockScheduleService.getCoverageAnalytics.mockResolvedValue(mockAnalytics);

      const req = utils.mockRequest({
        query: { date, location },
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.getCoverageAnalytics(req, res, next);

      expect(mockScheduleService.getCoverageAnalytics).toHaveBeenCalledWith(
        expect.any(Date),
        location,
        undefined
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalytics
      });
    });
  });

  describe('getEmployeeWorkload', () => {
    it('should get employee workload successfully', async () => {
      const employeeId = testEmployee._id.toString();
      const startDate = '2024-01-01';
      const endDate = '2024-01-07';

      const mockWorkload = {
        employeeId: testEmployee._id,
        totalHours: 40,
        totalShifts: 5
      };

      mockScheduleService.getEmployeeWorkload.mockResolvedValue(mockWorkload);

      const req = utils.mockRequest({
        params: { employeeId },
        query: { startDate, endDate },
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.getEmployeeWorkload(req, res, next);

      expect(mockScheduleService.getEmployeeWorkload).toHaveBeenCalledWith(
        employeeId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockWorkload
      });
    });
  });

  describe('detectConflicts', () => {
    it('should detect conflicts successfully', async () => {
      const employeeId = testEmployee._id.toString();
      const shiftId = new mongoose.Types.ObjectId().toString();

      const mockConflicts = [
        { type: 'DOUBLE_BOOKING', description: 'Overlapping shifts' }
      ];

      mockScheduleService.detectConflicts.mockResolvedValue(mockConflicts);

      const req = utils.mockRequest({
        params: { employeeId },
        query: { shiftId },
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.detectConflicts(req, res, next);

      expect(mockScheduleService.detectConflicts).toHaveBeenCalledWith(
        employeeId,
        shiftId
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockConflicts
      });
    });
  });

  describe('createRecurringTemplate', () => {
    it('should create recurring template successfully', async () => {
      const templateData = {
        name: 'Weekly Development',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office'
      };

      const mockTemplate = {
        _id: new mongoose.Types.ObjectId(),
        ...templateData,
        isActive: true
      };

      mockScheduleService.createRecurringTemplate.mockResolvedValue(mockTemplate);

      const req = utils.mockRequest({
        body: templateData,
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.createRecurringTemplate(req, res, next);

      expect(mockScheduleService.createRecurringTemplate).toHaveBeenCalledWith(templateData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'schedule.template_created',
        data: mockTemplate
      });
    });
  });

  describe('generateShiftsFromTemplate', () => {
    it('should generate shifts from template successfully', async () => {
      const templateId = new mongoose.Types.ObjectId().toString();
      const startDate = '2024-01-01';
      const endDate = '2024-01-07';

      const mockShifts = [
        { _id: new mongoose.Types.ObjectId(), role: 'DEVELOPER' }
      ];

      mockScheduleService.generateShiftsFromTemplate.mockResolvedValue(mockShifts);

      const req = utils.mockRequest({
        params: { templateId },
        query: { startDate, endDate },
        user: testUser,
        t: (key: string) => key
      });
      const res = utils.mockResponse();
      const next = utils.mockNext;

      await scheduleController.generateShiftsFromTemplate(req, res, next);

      expect(mockScheduleService.generateShiftsFromTemplate).toHaveBeenCalledWith(
        templateId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'schedule.shifts_generated',
        data: mockShifts
      });
    });
  });
}); 