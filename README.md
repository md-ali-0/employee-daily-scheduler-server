# Employee Daily Scheduler

A comprehensive backend service for managing employee schedules, shifts, and coverage built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **Employee Management**: Roles, skills, availability windows
- **Shift Management**: Create, assign, and manage shifts with conflict detection
- **Time-off Requests**: Request, approve, and track leave
- **Coverage Analytics**: Real-time coverage calculations and gap analysis
- **Recurring Templates**: Create and manage recurring shift patterns
- **Conflict Detection**: Automatic detection of overlaps and double-bookings
- **Workload Analytics**: Employee workload tracking and utilization metrics
- **Authentication & Authorization**: JWT-based auth with role-based access
- **API Documentation**: Swagger/OpenAPI documentation

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Passport.js
- **Validation**: Zod schema validation
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Logging**: Winston
- **Internationalization**: i18next

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- Redis (for session storage)
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employee-daily-scheduler-server
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/employee-scheduler
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-super-secret-jwt-key
   SESSION_SECRET=your-session-secret
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if not running)
   mongod
   
   # Seed the database with sample data
   pnpm run seed
   ```

5. **Start the server**
   ```bash
   # Development
   pnpm run dev
   
   # Production
   pnpm run build
   pnpm start
   ```

The server will be available at `http://localhost:3000`

## API Documentation

Once the server is running, visit `http://localhost:3000/api-docs` for interactive API documentation.

### Authentication

All API endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Employee Management
- `GET /api/v1/users` - List employees
- `POST /api/v1/users` - Create employee
- `GET /api/v1/users/:id` - Get employee details
- `PUT /api/v1/users/:id` - Update employee
- `DELETE /api/v1/users/:id` - Delete employee

#### Shift Management
- `GET /api/v1/schedule/shifts` - List shifts
- `POST /api/v1/schedule/shifts` - Create shift
- `GET /api/v1/schedule/shifts/:id` - Get shift details
- `PUT /api/v1/schedule/shifts/:id` - Update shift
- `DELETE /api/v1/schedule/shifts/:id` - Delete shift

#### Shift Assignment
- `POST /api/v1/schedule/shifts/:shiftId/assign/:employeeId` - Assign employee to shift
- `DELETE /api/v1/schedule/shifts/:shiftId/assign/:employeeId` - Remove employee from shift

#### Time-off Management
- `GET /api/v1/schedule/time-off` - List time-off requests
- `POST /api/v1/schedule/time-off` - Create time-off request
- `PUT /api/v1/schedule/time-off/:id/approve` - Approve time-off request
- `PUT /api/v1/schedule/time-off/:id/reject` - Reject time-off request

#### Analytics
- `GET /api/v1/schedule/daily-schedule` - Get daily schedule
- `GET /api/v1/schedule/coverage` - Get coverage analytics
- `GET /api/v1/schedule/workload/:employeeId` - Get employee workload
- `GET /api/v1/schedule/conflicts/:employeeId` - Detect conflicts

#### Recurring Templates
- `GET /api/v1/schedule/templates` - List recurring templates
- `POST /api/v1/schedule/templates` - Create recurring template
- `POST /api/v1/schedule/templates/:templateId/generate` - Generate shifts from template

## Data Model

### Employee
```typescript
interface IEmployee {
  _id: ObjectId;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  skills: string[];
  team?: string;
  availability?: IAvailability[];
  location?: string;
}

interface IAvailability {
  day: string; // e.g., "Monday"
  start: string; // "HH:mm" format
  end: string;   // "HH:mm" format
}
```

### Shift
```typescript
interface IShift {
  _id: ObjectId;
  date: Date;
  startTime: string; // "HH:mm" format
  endTime: string;   // "HH:mm" format
  role: string;
  skills: string[];
  location: string;
  team?: string;
  assignedEmployees: ObjectId[];
  maxEmployees?: number;
  minEmployees: number;
  isOvernight: boolean;
  status: 'OPEN' | 'FULL' | 'CANCELLED';
  notes?: string;
}
```

### Time-off Request
```typescript
interface ITimeOffRequest {
  _id: ObjectId;
  employeeId: ObjectId;
  startDate: Date;
  endDate: Date;
  startTime?: string; // "HH:mm" format for partial day
  endTime?: string;   // "HH:mm" format for partial day
  type: 'VACATION' | 'SICK' | 'PERSONAL' | 'OTHER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  approvedBy?: ObjectId;
  approvedAt?: Date;
}
```

## Database Indexes

The system includes optimized indexes for common query patterns:

### Shifts Collection
- `{ date: 1, location: 1 }` - Daily schedule queries
- `{ date: 1, team: 1 }` - Team-based queries
- `{ date: 1, role: 1 }` - Role-based queries
- `{ assignedEmployees: 1 }` - Employee assignment queries
- `{ status: 1, date: 1 }` - Status-based queries

### Time-off Requests Collection
- `{ employeeId: 1, startDate: 1, endDate: 1 }` - Employee time-off queries
- `{ status: 1, startDate: 1 }` - Status-based queries
- `{ type: 1, status: 1 }` - Type-based queries

### Shift Assignments Collection
- `{ shiftId: 1, employeeId: 1 }` - Assignment queries
- `{ employeeId: 1, status: 1 }` - Employee status queries

## Conflict Detection Rules

The system automatically detects and prevents:

1. **Double Booking**: Employee assigned to overlapping shifts
2. **Time-off Conflicts**: Employee assigned during approved time-off
3. **Availability Mismatch**: Employee assigned outside their availability
4. **Overnight Shift Conflicts**: Proper handling of shifts spanning midnight

## Coverage Logic

Coverage is calculated as:
```
Coverage % = (Assigned Employees / Required Employees) × 100
Gaps = max(Required Employees - Assigned Employees, 0)
Utilization % = (Assigned Employees / Required Employees) × 100
```

## Sample Requests

### Create a Shift
```bash
curl -X POST http://localhost:3000/api/v1/schedule/shifts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "17:00",
    "role": "EMPLOYEE",
    "skills": ["Customer Service", "Cash Handling"],
    "location": "Downtown Store",
    "team": "Morning Shift",
    "maxEmployees": 3,
    "minEmployees": 2
  }'
```

### Get Daily Schedule
```bash
curl -X GET "http://localhost:3000/api/v1/schedule/daily-schedule?date=2024-01-15&location=Downtown%20Store" \
  -H "Authorization: Bearer <token>"
```

### Get Coverage Analytics
```bash
curl -X GET "http://localhost:3000/api/v1/schedule/coverage?date=2024-01-15&location=Downtown%20Store" \
  -H "Authorization: Bearer <token>"
```

### Assign Employee to Shift
```bash
curl -X POST http://localhost:3000/api/v1/schedule/shifts/64f1a2b3c4d5e6f7g8h9i0j1/assign/64f1a2b3c4d5e6f7g8h9i0j2 \
  -H "Authorization: Bearer <token>"
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Development

### Code Generation
```bash
# Generate a new module
pnpm run generate:module
```

### Linting and Formatting
```bash
# Lint code
pnpm lint

# Format code
pnpm format
```

## Deployment

### Docker
```bash
# Build image
docker build -t employee-scheduler .

# Run container
docker run -p 3000:3000 employee-scheduler
```

### Environment Variables
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `SESSION_SECRET`: Session secret
- `SENTRY_DSN`: Sentry error tracking (optional)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, please open an issue in the repository.

