const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const { UserModel } = require('../dist/src/modules/user/user.model');
const { EmployeeModel } = require('../dist/src/modules/employee/employee.model');
const { ShiftModel, TimeOffRequestModel, RecurringShiftTemplateModel } = require('../dist/src/modules/schedule/schedule.model');

// Sample data
const ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE'];
const SKILLS = [
  'Customer Service', 'Sales', 'Inventory Management', 'Cash Handling',
  'Food Preparation', 'Kitchen Management', 'Barista', 'Cleaning',
  'Security', 'Maintenance', 'IT Support', 'Administration'
];
const LOCATIONS = ['Downtown Store', 'Mall Location', 'Airport Store', 'University Campus'];
const TEAMS = ['Morning Shift', 'Afternoon Shift', 'Night Shift', 'Weekend Team'];

// Employee data
const employees = [
  {
    name: 'John Smith',
    email: 'john.smith@company.com',
    phone: '+1-555-0101',
    role: 'MANAGER',
    skills: ['Customer Service', 'Sales', 'Inventory Management'],
    team: 'Morning Shift',
    location: 'Downtown Store',
    availability: [
      { day: 'Monday', start: '08:00', end: '16:00' },
      { day: 'Tuesday', start: '08:00', end: '16:00' },
      { day: 'Wednesday', start: '08:00', end: '16:00' },
      { day: 'Thursday', start: '08:00', end: '16:00' },
      { day: 'Friday', start: '08:00', end: '16:00' }
    ]
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1-555-0102',
    role: 'EMPLOYEE',
    skills: ['Customer Service', 'Cash Handling'],
    team: 'Morning Shift',
    location: 'Downtown Store',
    availability: [
      { day: 'Monday', start: '09:00', end: '17:00' },
      { day: 'Tuesday', start: '09:00', end: '17:00' },
      { day: 'Wednesday', start: '09:00', end: '17:00' },
      { day: 'Thursday', start: '09:00', end: '17:00' },
      { day: 'Friday', start: '09:00', end: '17:00' }
    ]
  },
  {
    name: 'Mike Davis',
    email: 'mike.davis@company.com',
    phone: '+1-555-0103',
    role: 'EMPLOYEE',
    skills: ['Food Preparation', 'Kitchen Management'],
    team: 'Afternoon Shift',
    location: 'Mall Location',
    availability: [
      { day: 'Tuesday', start: '14:00', end: '22:00' },
      { day: 'Wednesday', start: '14:00', end: '22:00' },
      { day: 'Thursday', start: '14:00', end: '22:00' },
      { day: 'Friday', start: '14:00', end: '22:00' },
      { day: 'Saturday', start: '12:00', end: '20:00' }
    ]
  },
  {
    name: 'Emily Wilson',
    email: 'emily.wilson@company.com',
    phone: '+1-555-0104',
    role: 'EMPLOYEE',
    skills: ['Barista', 'Customer Service'],
    team: 'Morning Shift',
    location: 'University Campus',
    availability: [
      { day: 'Monday', start: '07:00', end: '15:00' },
      { day: 'Tuesday', start: '07:00', end: '15:00' },
      { day: 'Wednesday', start: '07:00', end: '15:00' },
      { day: 'Thursday', start: '07:00', end: '15:00' },
      { day: 'Friday', start: '07:00', end: '15:00' }
    ]
  },
  {
    name: 'David Brown',
    email: 'david.brown@company.com',
    phone: '+1-555-0105',
    role: 'MANAGER',
    skills: ['Security', 'Administration'],
    team: 'Night Shift',
    location: 'Airport Store',
    availability: [
      { day: 'Monday', start: '22:00', end: '06:00' },
      { day: 'Tuesday', start: '22:00', end: '06:00' },
      { day: 'Wednesday', start: '22:00', end: '06:00' },
      { day: 'Thursday', start: '22:00', end: '06:00' },
      { day: 'Friday', start: '22:00', end: '06:00' }
    ]
  },
  {
    name: 'Lisa Garcia',
    email: 'lisa.garcia@company.com',
    phone: '+1-555-0106',
    role: 'EMPLOYEE',
    skills: ['Customer Service', 'Sales'],
    team: 'Weekend Team',
    location: 'Mall Location',
    availability: [
      { day: 'Saturday', start: '10:00', end: '18:00' },
      { day: 'Sunday', start: '10:00', end: '18:00' }
    ]
  },
  {
    name: 'Tom Anderson',
    email: 'tom.anderson@company.com',
    phone: '+1-555-0107',
    role: 'EMPLOYEE',
    skills: ['Maintenance', 'IT Support'],
    team: 'Afternoon Shift',
    location: 'Downtown Store',
    availability: [
      { day: 'Monday', start: '12:00', end: '20:00' },
      { day: 'Tuesday', start: '12:00', end: '20:00' },
      { day: 'Wednesday', start: '12:00', end: '20:00' },
      { day: 'Thursday', start: '12:00', end: '20:00' },
      { day: 'Friday', start: '12:00', end: '20:00' }
    ]
  },
  {
    name: 'Jessica Lee',
    email: 'jessica.lee@company.com',
    phone: '+1-555-0108',
    role: 'EMPLOYEE',
    skills: ['Cleaning', 'Customer Service'],
    team: 'Night Shift',
    location: 'University Campus',
    availability: [
      { day: 'Monday', start: '20:00', end: '04:00' },
      { day: 'Tuesday', start: '20:00', end: '04:00' },
      { day: 'Wednesday', start: '20:00', end: '04:00' },
      { day: 'Thursday', start: '20:00', end: '04:00' },
      { day: 'Friday', start: '20:00', end: '04:00' }
    ]
  }
];

// Recurring shift templates
const recurringTemplates = [
  {
    name: 'Morning Cashier',
    dayOfWeek: 1, // Monday
    startTime: '08:00',
    endTime: '16:00',
    role: 'EMPLOYEE',
    skills: ['Customer Service', 'Cash Handling'],
    location: 'Downtown Store',
    team: 'Morning Shift',
    maxEmployees: 3,
    minEmployees: 2
  },
  {
    name: 'Afternoon Kitchen',
    dayOfWeek: 2, // Tuesday
    startTime: '14:00',
    endTime: '22:00',
    role: 'EMPLOYEE',
    skills: ['Food Preparation', 'Kitchen Management'],
    location: 'Mall Location',
    team: 'Afternoon Shift',
    maxEmployees: 2,
    minEmployees: 1
  },
  {
    name: 'Night Security',
    dayOfWeek: 1, // Monday
    startTime: '22:00',
    endTime: '06:00',
    role: 'EMPLOYEE',
    skills: ['Security'],
    location: 'Airport Store',
    team: 'Night Shift',
    maxEmployees: 2,
    minEmployees: 1
  },
  {
    name: 'Weekend Barista',
    dayOfWeek: 6, // Saturday
    startTime: '10:00',
    endTime: '18:00',
    role: 'EMPLOYEE',
    skills: ['Barista', 'Customer Service'],
    location: 'University Campus',
    team: 'Weekend Team',
    maxEmployees: 2,
    minEmployees: 1
  }
];

// Time-off requests
const timeOffRequests = [
  {
    employeeId: null, // Will be set after employee creation
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-17'),
    type: 'VACATION',
    reason: 'Family vacation',
    status: 'PENDING'
  },
  {
    employeeId: null,
    startDate: new Date('2024-01-20'),
    endDate: new Date('2024-01-20'),
    startTime: '09:00',
    endTime: '17:00',
    type: 'PERSONAL',
    reason: 'Doctor appointment',
    status: 'APPROVED'
  },
  {
    employeeId: null,
    startDate: new Date('2024-01-25'),
    endDate: new Date('2024-01-27'),
    type: 'SICK',
    reason: 'Flu',
    status: 'APPROVED'
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/employee-scheduler');
    
    console.log('Clearing existing data...');
    await UserModel.deleteMany({});
    await EmployeeModel.deleteMany({});
    await ShiftModel.deleteMany({});
    await TimeOffRequestModel.deleteMany({});
    await RecurringShiftTemplateModel.deleteMany({});
    
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await UserModel.create({
      email: 'admin@company.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      skills: ['Administration', 'Management'],
      availability: []
    });
    
    console.log('Creating employees...');
    const createdEmployees = [];
    for (const employeeData of employees) {
      const employee = await EmployeeModel.create(employeeData);
      createdEmployees.push(employee);
      console.log(`Created employee: ${employee.name}`);
    }
    
    console.log('Creating recurring shift templates...');
    const createdTemplates = [];
    for (const templateData of recurringTemplates) {
      const template = await RecurringShiftTemplateModel.create(templateData);
      createdTemplates.push(template);
      console.log(`Created template: ${template.name}`);
    }
    
    console.log('Creating time-off requests...');
    for (let i = 0; i < timeOffRequests.length; i++) {
      const requestData = { ...timeOffRequests[i] };
      requestData.employeeId = createdEmployees[i % createdEmployees.length]._id;
      await TimeOffRequestModel.create(requestData);
      console.log(`Created time-off request for: ${createdEmployees[i % createdEmployees.length].name}`);
    }
    
    console.log('Generating shifts for the next 30 days...');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    for (const template of createdTemplates) {
      const shifts = await generateShiftsFromTemplate(template, startDate, endDate);
      console.log(`Generated ${shifts.length} shifts from template: ${template.name}`);
    }
    
    console.log('Seeding completed successfully!');
    console.log('\nSample data created:');
    console.log(`- ${createdEmployees.length} employees`);
    console.log(`- ${createdTemplates.length} recurring templates`);
    console.log(`- ${timeOffRequests.length} time-off requests`);
    console.log('- Multiple shifts for the next 30 days');
    
    console.log('\nAdmin credentials:');
    console.log('Email: admin@company.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

async function generateShiftsFromTemplate(template, startDate, endDate) {
  const shifts = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (currentDate.getDay() === template.dayOfWeek) {
      const shift = await ShiftModel.create({
        date: new Date(currentDate),
        startTime: template.startTime,
        endTime: template.endTime,
        role: template.role,
        skills: template.skills,
        location: template.location,
        team: template.team,
        maxEmployees: template.maxEmployees,
        minEmployees: template.minEmployees,
        isOvernight: isOvernightShift(template.startTime, template.endTime),
        status: 'OPEN'
      });
      shifts.push(shift);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return shifts;
}

function isOvernightShift(startTime, endTime) {
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  return end < start;
}

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase }; 