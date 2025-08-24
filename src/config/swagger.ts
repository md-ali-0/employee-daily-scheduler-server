import logger from "@config/winston"
import type { Express } from "express"
import swaggerUi from "swagger-ui-express"

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Employee Daily Scheduler API",
    version: "1.0.0",
    description: "API documentation for the Employee Daily Scheduler system with shift management, time-off requests, and coverage analytics.",
  },
  servers: [
    {
      url: "/api/v1",
      description: "Development Server",
    },
  ],
  tags: [
    { name: "Auth", description: "User authentication and authorization" },
    { name: "Users", description: "User management" },
    { name: "Employees", description: "Employee management with roles and availability" },
    { name: "Schedule", description: "Shift management and scheduling" },
    { name: "Time-off", description: "Time-off request management" },
    { name: "Analytics", description: "Coverage and workload analytics" },
    { name: "Health", description: "Application health checks" },
    { name: "System", description: "System-level information" },
    { name: "Files", description: "File upload and management" },
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { description: "Invalid input" },
          409: { description: "User already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in a user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful", headers: { "Set-Cookie": { schema: { type: "string" } } } },
          401: { description: "Invalid credentials" },
          403: { description: "Account locked" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out a user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Logout successful" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/refresh-token": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token using refresh token",
        responses: {
          200: {
            description: "Token refreshed successfully",
            headers: { "Set-Cookie": { schema: { type: "string" } } },
          },
          401: { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Send password reset email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset email sent successfully" },
          400: { description: "Invalid email" },
          404: { description: "User not found" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: { type: "string" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset successfully" },
          400: { description: "Invalid token or password" },
          404: { description: "User not found" },
        },
      },
    },
    "/auth/google": {
      get: {
        tags: ["Auth"],
        summary: "Initiate Google OAuth login",
        responses: {
          302: { description: "Redirect to Google OAuth" },
        },
      },
    },
    "/auth/google/callback": {
      get: {
        tags: ["Auth"],
        summary: "Google OAuth callback",
        parameters: [
          { name: "code", in: "query", schema: { type: "string" } },
          { name: "error", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Google OAuth successful" },
          400: { description: "OAuth error" },
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get current user's profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "User profile" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/users": {
      get: {
        tags: ["Users"],
        summary: "Get all users (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "role", in: "query", schema: { type: "string", enum: ["ADMIN", "MANAGER", "EMPLOYEE"] } },
          { name: "delete", in: "query", schema: { type: "string", enum: ["YES", "NO"] } },
        ],
        responses: {
          200: { description: "List of users" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Create a new user (Admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  name: { type: "string" },
                  role: { type: "string", enum: ["ADMIN", "MANAGER", "EMPLOYEE"], default: "EMPLOYEE" },
                  skills: { type: "array", items: { type: "string" } },
                  availability: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string" },
                        start: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                        end: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                      },
                    },
                  },
                  team: { type: "string" },
                  location: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User created successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          409: { description: "User already exists" },
        },
      },
    },
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "User details" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "User not found" },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update user by ID (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  name: { type: "string" },
                  role: { type: "string", enum: ["ADMIN", "MANAGER", "EMPLOYEE"] },
                  skills: { type: "array", items: { type: "string" } },
                  availability: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string" },
                        start: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                        end: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                      },
                    },
                  },
                  team: { type: "string" },
                  location: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "User updated successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "User not found" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Soft delete user by ID (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "User deleted successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "User not found" },
        },
      },
    },
    "/schedule/shifts": {
      get: {
        tags: ["Schedule"],
        summary: "Get all shifts with pagination and filtering",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "location", in: "query", schema: { type: "string" } },
          { name: "team", in: "query", schema: { type: "string" } },
          { name: "role", in: "query", schema: { type: "string" } },
          { name: "date", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: { description: "List of shifts" },
          401: { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Schedule"],
        summary: "Create a new shift",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["date", "startTime", "endTime", "role", "skills", "location"],
                properties: {
                  date: { type: "string", format: "date-time" },
                  startTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                  endTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                  role: { type: "string" },
                  skills: { type: "array", items: { type: "string" } },
                  location: { type: "string" },
                  team: { type: "string" },
                  maxEmployees: { type: "integer", minimum: 1 },
                  minEmployees: { type: "integer", minimum: 1, default: 1 },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Shift created successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/schedule/shifts/{id}": {
      get: {
        tags: ["Schedule"],
        summary: "Get shift by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Shift details" },
          401: { description: "Unauthorized" },
          404: { description: "Shift not found" },
        },
      },
      put: {
        tags: ["Schedule"],
        summary: "Update shift by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  date: { type: "string", format: "date-time" },
                  startTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                  endTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                  role: { type: "string" },
                  skills: { type: "array", items: { type: "string" } },
                  location: { type: "string" },
                  team: { type: "string" },
                  maxEmployees: { type: "integer", minimum: 1 },
                  minEmployees: { type: "integer", minimum: 1 },
                  status: { type: "string", enum: ["OPEN", "FULL", "CANCELLED"] },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Shift updated successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          404: { description: "Shift not found" },
        },
      },
      delete: {
        tags: ["Schedule"],
        summary: "Delete shift by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Shift deleted successfully" },
          401: { description: "Unauthorized" },
          404: { description: "Shift not found" },
        },
      },
    },
    "/schedule/shifts/{shiftId}/assign/{employeeId}": {
      post: {
        tags: ["Schedule"],
        summary: "Assign employee to shift",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "shiftId", in: "path", required: true, schema: { type: "string" } },
          { name: "employeeId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Employee assigned successfully" },
          400: { description: "Assignment failed or conflicts detected" },
          401: { description: "Unauthorized" },
          404: { description: "Shift or employee not found" },
        },
      },
      delete: {
        tags: ["Schedule"],
        summary: "Remove employee from shift",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "shiftId", in: "path", required: true, schema: { type: "string" } },
          { name: "employeeId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Employee removed successfully" },
          401: { description: "Unauthorized" },
          404: { description: "Assignment not found" },
        },
      },
    },
    "/schedule/time-off": {
      get: {
        tags: ["Time-off"],
        summary: "Get all time-off requests",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] } },
          { name: "employeeId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of time-off requests" },
          401: { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Time-off"],
        summary: "Create a new time-off request",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["employeeId", "startDate", "endDate", "type", "reason"],
                properties: {
                  employeeId: { type: "string" },
                  startDate: { type: "string", format: "date-time" },
                  endDate: { type: "string", format: "date-time" },
                  startTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                  endTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                  type: { type: "string", enum: ["VACATION", "SICK", "PERSONAL", "OTHER"] },
                  reason: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Time-off request created successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/schedule/time-off/{id}/approve": {
      put: {
        tags: ["Time-off"],
        summary: "Approve time-off request",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Time-off request approved successfully" },
          401: { description: "Unauthorized" },
          404: { description: "Time-off request not found" },
        },
      },
    },
    "/schedule/time-off/{id}/reject": {
      put: {
        tags: ["Time-off"],
        summary: "Reject time-off request",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Time-off request rejected successfully" },
          401: { description: "Unauthorized" },
          404: { description: "Time-off request not found" },
        },
      },
    },
    "/schedule/daily-schedule": {
      get: {
        tags: ["Schedule"],
        summary: "Get daily schedule for a specific date",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "date", in: "query", required: true, schema: { type: "string", format: "date" } },
          { name: "location", in: "query", schema: { type: "string" } },
          { name: "team", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Daily schedule" },
          400: { description: "Date parameter required" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/schedule/coverage": {
      get: {
        tags: ["Analytics"],
        summary: "Get coverage analytics for a specific date",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "date", in: "query", required: true, schema: { type: "string", format: "date" } },
          { name: "location", in: "query", schema: { type: "string" } },
          { name: "team", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Coverage analytics" },
          400: { description: "Date parameter required" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/schedule/workload/{employeeId}": {
      get: {
        tags: ["Analytics"],
        summary: "Get employee workload for a date range",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "employeeId", in: "path", required: true, schema: { type: "string" } },
          { name: "startDate", in: "query", required: true, schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", required: true, schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: { description: "Employee workload analytics" },
          400: { description: "Date range required" },
          401: { description: "Unauthorized" },
          404: { description: "Employee not found" },
        },
      },
    },
    "/schedule/conflicts/{employeeId}": {
      get: {
        tags: ["Schedule"],
        summary: "Detect conflicts for an employee",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "employeeId", in: "path", required: true, schema: { type: "string" } },
          { name: "shiftId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Conflict analysis" },
          401: { description: "Unauthorized" },
          404: { description: "Employee not found" },
        },
      },
    },
    "/schedule/templates": {
      get: {
        tags: ["Schedule"],
        summary: "Get all recurring shift templates",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "isActive", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          200: { description: "List of recurring templates" },
          401: { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Schedule"],
        summary: "Create a new recurring shift template",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "dayOfWeek", "startTime", "endTime", "role", "skills", "location"],
                properties: {
                  name: { type: "string" },
                  dayOfWeek: { type: "integer", minimum: 0, maximum: 6 },
                  startTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                  endTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                  role: { type: "string" },
                  skills: { type: "array", items: { type: "string" } },
                  location: { type: "string" },
                  team: { type: "string" },
                  maxEmployees: { type: "integer", minimum: 1 },
                  minEmployees: { type: "integer", minimum: 1, default: 1 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Template created successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/schedule/templates/{templateId}/generate": {
      post: {
        tags: ["Schedule"],
        summary: "Generate shifts from template",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "templateId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["startDate", "endDate"],
                properties: {
                  startDate: { type: "string", format: "date" },
                  endDate: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Shifts generated successfully" },
          400: { description: "Date range required" },
          401: { description: "Unauthorized" },
          404: { description: "Template not found" },
        },
      },
    },
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check application health",
        responses: {
          200: { description: "Application is healthy" },
          500: { description: "Application is unhealthy" },
        },
      },
    },
    "/system/info": {
      get: {
        tags: ["System"],
        summary: "Get system information",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "System information" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/files": {
      get: {
        tags: ["Files"],
        summary: "Get all files with pagination and filtering",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "searchTerm", in: "query", schema: { type: "string" } },
          { name: "mimeType", in: "query", schema: { type: "string" } },
          { name: "provider", in: "query", schema: { type: "string", enum: ["LOCAL", "S3", "CLOUDINARY"] } },
          { name: "uploadedBy", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "delete", in: "query", schema: { type: "string", enum: ["YES", "NO"] } },
        ],
        responses: {
          200: { description: "List of files" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/files/upload": {
      post: {
        tags: ["Files"],
        summary: "Upload a file",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "File uploaded successfully" },
          400: { description: "Invalid file or upload error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/files/{id}": {
      get: {
        tags: ["Files"],
        summary: "Get file metadata by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "File metadata" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "File not found" },
        },
      },
      delete: {
        tags: ["Files"],
        summary: "Delete a file by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "File deleted successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "File not found" },
        },
      },
    },
    "/files/{id}/download": {
      get: {
        tags: ["Files"],
        summary: "Download a file by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { 
            description: "File download",
            content: {
              "application/octet-stream": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "File not found" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Shift: {
        type: "object",
        properties: {
          id: { type: "string" },
          date: { type: "string", format: "date-time" },
          startTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
          endTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
          role: { type: "string" },
          skills: { type: "array", items: { type: "string" } },
          location: { type: "string" },
          team: { type: "string" },
          assignedEmployees: { type: "array", items: { type: "string" } },
          maxEmployees: { type: "integer" },
          minEmployees: { type: "integer" },
          isOvernight: { type: "boolean" },
          status: { type: "string", enum: ["OPEN", "FULL", "CANCELLED"] },
          notes: { type: "string" },
        },
      },
      TimeOffRequest: {
        type: "object",
        properties: {
          id: { type: "string" },
          employeeId: { type: "string" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          startTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
          endTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
          type: { type: "string", enum: ["VACATION", "SICK", "PERSONAL", "OTHER"] },
          status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
          reason: { type: "string" },
          approvedBy: { type: "string" },
          approvedAt: { type: "string", format: "date-time" },
        },
      },
      CoverageAnalytics: {
        type: "object",
        properties: {
          date: { type: "string", format: "date" },
          location: { type: "string" },
          team: { type: "string" },
          role: { type: "string" },
          required: { type: "integer" },
          assigned: { type: "integer" },
          coverage: { type: "number" },
          gaps: { type: "integer" },
          conflicts: { type: "integer" },
          utilization: { type: "number" },
        },
      },
      WorkloadAnalytics: {
        type: "object",
        properties: {
          employeeId: { type: "string" },
          employeeName: { type: "string" },
          dateRange: {
            type: "object",
            properties: {
              start: { type: "string", format: "date" },
              end: { type: "string", format: "date" },
            },
          },
          totalHours: { type: "number" },
          totalShifts: { type: "integer" },
          averageHoursPerDay: { type: "number" },
          overtimeHours: { type: "number" },
          utilization: { type: "number" },
        },
      },
    },
  },
}

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  logger.info("Swagger UI is available at /api-docs")
}

