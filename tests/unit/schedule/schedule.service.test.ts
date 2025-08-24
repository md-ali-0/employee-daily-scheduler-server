import mongoose from 'mongoose';
import { BadRequestError, NotFoundError } from '../../../src/core/error.classes';
import { ScheduleService } from '../../../src/modules/schedule/schedule.service';
import { utils } from '../../setup';

describe('ScheduleService', () => {
  let scheduleService: ScheduleService;
  let testUser: any;
  let testEmployee: any;

  beforeEach(async () => {
    scheduleService = new ScheduleService();
    testUser = await utils.createTestUser();
    testEmployee = await utils.createTestEmployee();
  });

  describe('createShift', () => {
    it('should create a shift successfully', async () => {
      const shiftData = {
        date: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript', 'TypeScript'],
        location: 'Office',
        minEmployees: 1,
        maxEmployees: 3
      };

      const shift = await scheduleService.createShift(shiftData);

      expect(shift).toBeDefined();
      expect(shift.date).toEqual(shiftData.date);
      expect(shift.startTime).toBe(shiftData.startTime);
      expect(shift.endTime).toBe(shiftData.endTime);
      expect(shift.role).toBe(shiftData.role);
      expect(shift.status).toBe('OPEN');
    });

    it('should throw error for invalid time format', async () => {
      const shiftData = {
        date: new Date(),
        startTime: '9:00', // Invalid format
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office'
      };

      await expect(scheduleService.createShift(shiftData)).rejects.toThrow(BadRequestError);
    });

    it('should throw error when end time is before start time', async () => {
      const shiftData = {
        date: new Date(),
        startTime: '17:00',
        endTime: '09:00', // Before start time
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office'
      };

      await expect(scheduleService.createShift(shiftData)).rejects.toThrow(BadRequestError);
    });
  });

  describe('updateShift', () => {
    it('should update a shift successfully', async () => {
      const shift = await utils.createTestShift();
      const updateData = {
        startTime: '10:00',
        endTime: '18:00',
        notes: 'Updated shift'
      };

      const updatedShift = await scheduleService.updateShift(shift._id.toString(), updateData);

      expect(updatedShift.startTime).toBe(updateData.startTime);
      expect(updatedShift.endTime).toBe(updateData.endTime);
      expect(updatedShift.notes).toBe(updateData.notes);
    });

    it('should throw error when shift not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updateData = { startTime: '10:00' };

      await expect(scheduleService.updateShift(fakeId, updateData)).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteShift', () => {
    it('should delete a shift successfully', async () => {
      const shift = await utils.createTestShift();

      await expect(scheduleService.deleteShift(shift._id.toString())).resolves.not.toThrow();
    });

    it('should throw error when shift not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(scheduleService.deleteShift(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('assignEmployeeToShift', () => {
    it('should assign employee to shift successfully', async () => {
      const shift = await utils.createTestShift({ maxEmployees: 2 });
      const employee = await utils.createTestEmployee();

      const assignment = await scheduleService.assignEmployeeToShift(
        shift._id.toString(),
        employee._id.toString(),
        testUser._id.toString()
      );

      expect(assignment).toBeDefined();
      expect(assignment.shiftId.toString()).toBe(shift._id.toString());
      expect(assignment.employeeId.toString()).toBe(employee._id.toString());
      expect(assignment.status).toBe('ASSIGNED');
    });

    it('should throw error when shift is at maximum capacity', async () => {
      const shift = await utils.createTestShift({ maxEmployees: 1 });
      const employee1 = await utils.createTestEmployee();
      const employee2 = await utils.createTestEmployee();

      // Assign first employee
      await scheduleService.assignEmployeeToShift(
        shift._id.toString(),
        employee1._id.toString(),
        testUser._id.toString()
      );

      // Try to assign second employee
      await expect(
        scheduleService.assignEmployeeToShift(
          shift._id.toString(),
          employee2._id.toString(),
          testUser._id.toString()
        )
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('removeEmployeeFromShift', () => {
    it('should remove employee from shift successfully', async () => {
      const shift = await utils.createTestShift();
      const employee = await utils.createTestEmployee();

      // First assign employee
      await scheduleService.assignEmployeeToShift(
        shift._id.toString(),
        employee._id.toString(),
        testUser._id.toString()
      );

      // Then remove employee
      await expect(
        scheduleService.removeEmployeeFromShift(shift._id.toString(), employee._id.toString())
      ).resolves.not.toThrow();
    });
  });

  describe('createTimeOffRequest', () => {
    it('should create time-off request successfully', async () => {
      const requestData = {
        employeeId: testEmployee._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        type: 'VACATION' as const,
        reason: 'Annual leave'
      };

      const request = await scheduleService.createTimeOffRequest(requestData);

      expect(request).toBeDefined();
      expect(request.employeeId.toString()).toBe(testEmployee._id.toString());
      expect(request.type).toBe('VACATION');
      expect(request.status).toBe('PENDING');
    });
  });

  describe('approveTimeOffRequest', () => {
    it('should approve time-off request successfully', async () => {
      const request = await scheduleService.createTimeOffRequest({
        employeeId: testEmployee._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        type: 'VACATION',
        reason: 'Annual leave'
      });

      const approvedRequest = await scheduleService.approveTimeOffRequest(
        request._id.toString(),
        testUser._id.toString()
      );

      expect(approvedRequest.status).toBe('APPROVED');
      expect(approvedRequest.approvedBy.toString()).toBe(testUser._id.toString());
      expect(approvedRequest.approvedAt).toBeDefined();
    });
  });

  describe('rejectTimeOffRequest', () => {
    it('should reject time-off request successfully', async () => {
      const request = await scheduleService.createTimeOffRequest({
        employeeId: testEmployee._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        type: 'VACATION',
        reason: 'Annual leave'
      });

      const rejectedRequest = await scheduleService.rejectTimeOffRequest(
        request._id.toString(),
        testUser._id.toString()
      );

      expect(rejectedRequest.status).toBe('REJECTED');
      expect(rejectedRequest.approvedBy.toString()).toBe(testUser._id.toString());
      expect(rejectedRequest.approvedAt).toBeDefined();
    });
  });

  describe('getDailySchedule', () => {
    it('should return daily schedule', async () => {
      const today = new Date();
      await utils.createTestShift({ date: today });
      await utils.createTestShift({ date: new Date(today.getTime() + 24 * 60 * 60 * 1000) }); // Tomorrow

      const schedule = await scheduleService.getDailySchedule(today);

      expect(schedule).toHaveLength(1);
      expect(schedule[0].date.toDateString()).toBe(today.toDateString());
    });
  });

  describe('getCoverageAnalytics', () => {
    it('should return coverage analytics', async () => {
      const today = new Date();
      await utils.createTestShift({ date: today, minEmployees: 2 });

      const analytics = await scheduleService.getCoverageAnalytics(today);

      expect(analytics).toBeDefined();
      expect(Array.isArray(analytics)).toBe(true);
    });
  });

  describe('getEmployeeWorkload', () => {
    it('should return employee workload', async () => {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
      const employee = await utils.createTestEmployee();

      const workload = await scheduleService.getEmployeeWorkload(
        employee._id.toString(),
        startDate,
        endDate
      );

      expect(workload).toBeDefined();
      expect(workload.employeeId.toString()).toBe(employee._id.toString());
      expect(workload.totalHours).toBeDefined();
      expect(workload.totalShifts).toBeDefined();
    });
  });

  describe('detectConflicts', () => {
    it('should detect conflicts for employee', async () => {
      const employee = await utils.createTestEmployee();
      const today = new Date();

      // Create overlapping shifts
      await utils.createTestShift({ 
        date: today, 
        startTime: '09:00', 
        endTime: '17:00',
        assignedEmployees: [employee._id]
      });
      await utils.createTestShift({ 
        date: today, 
        startTime: '16:00', 
        endTime: '20:00',
        assignedEmployees: [employee._id]
      });

      const conflicts = await scheduleService.detectConflicts(employee._id.toString());

      expect(conflicts).toBeDefined();
      expect(Array.isArray(conflicts)).toBe(true);
    });
  });

  describe('createRecurringTemplate', () => {
    it('should create recurring template successfully', async () => {
      const templateData = {
        name: 'Weekly Development Shift',
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript', 'TypeScript'],
        location: 'Office'
      };

      const template = await scheduleService.createRecurringTemplate(templateData);

      expect(template).toBeDefined();
      expect(template.name).toBe(templateData.name);
      expect(template.dayOfWeek).toBe(templateData.dayOfWeek);
      expect(template.isActive).toBe(true);
    });
  });

  describe('generateShiftsFromTemplate', () => {
    it('should generate shifts from template', async () => {
      const template = await scheduleService.createRecurringTemplate({
        name: 'Weekly Development Shift',
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        role: 'DEVELOPER',
        skills: ['JavaScript'],
        location: 'Office'
      });

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks later

      const shifts = await scheduleService.generateShiftsFromTemplate(
        template._id.toString(),
        startDate,
        endDate
      );

      expect(shifts).toBeDefined();
      expect(Array.isArray(shifts)).toBe(true);
    });
  });

  describe('findById', () => {
    it('should find shift by id', async () => {
      const shift = await utils.createTestShift();

      const foundShift = await scheduleService.findById(shift._id.toString());

      expect(foundShift).toBeDefined();
      expect(foundShift._id.toString()).toBe(shift._id.toString());
    });

    it('should throw error when shift not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(scheduleService.findById(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAll', () => {
    it('should return paginated shifts', async () => {
      await utils.createTestShift();
      await utils.createTestShift();

      const result = await scheduleService.getAll({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });
}); 