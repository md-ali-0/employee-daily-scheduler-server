import logger from "@config/winston"
import type { Express } from "express"
import swaggerUi from "swagger-ui-express"

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Node.js Enterprise Server API",
    version: "1.0.0",
    description: "API documentation for the Node.js Enterprise Server boilerplate.",
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
    { name: "Health", description: "Application health checks" },
    { name: "System", description: "System-level information" },
    { name: "Posts", description: "Blog post management" },
    { name: "Categories", description: "Blog post categories" },
    { name: "Tags", description: "Blog post tags" },
    { name: "Series", description: "Blog post series" },
    { name: "Comments", description: "Blog post comments" },
    { name: "Likes", description: "Blog post likes" },
    { name: "Bookmarks", description: "User bookmarks" },
    { name: "Files", description: "File upload and management" },
    { name: "Newsletter", description: "Newsletter subscription management" },
    { name: "Contact", description: "Contact form and inquiry management" },
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
    "/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP for password reset",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp"],
                properties: {
                  email: { type: "string", format: "email" },
                  otp: { type: "string", minLength: 6, maxLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "OTP verified successfully" },
          400: { description: "Invalid OTP" },
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
    "/auth/reset-password-otp": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  otp: { type: "string", minLength: 6, maxLength: 6 },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset successfully" },
          400: { description: "Invalid OTP or password" },
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
          { name: "role", in: "query", schema: { type: "string", enum: ["ADMIN", "EDITOR", "AUTHOR", "USER"] } },
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
                  role: { type: "string", enum: ["ADMIN", "EDITOR", "AUTHOR", "USER"], default: "USER" },
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
                  role: { type: "string", enum: ["ADMIN", "EDITOR", "AUTHOR", "USER"] },
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
    "/posts": {
      get: {
        tags: ["Posts"],
        summary: "Get all posts",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["DRAFT", "PUBLISHED", "SCHEDULED"] } },
          { name: "categoryId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "tagId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "seriesId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "authorId", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "List of posts" },
          401: { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Posts"],
        summary: "Create a new post",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "content"],
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  status: { type: "string", enum: ["DRAFT", "PUBLISHED", "SCHEDULED"], default: "DRAFT" },
                  publishedAt: { type: "string", format: "date-time", description: "Required if status is SCHEDULED" },
                  categoryId: { type: "string", format: "uuid" },
                  seriesId: { type: "string", format: "uuid" },
                  featuredImageId: { type: "string", format: "uuid" },
                  tagIds: { type: "array", items: { type: "string", format: "uuid" } },
                  metaTitle: { type: "string" },
                  metaDescription: { type: "string" },
                  canonicalUrl: { type: "string", format: "url" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Post created successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/posts/{id}": {
      get: {
        tags: ["Posts"],
        summary: "Get a post by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Post details" },
          404: { description: "Post not found" },
        },
      },
      put: {
        tags: ["Posts"],
        summary: "Update a post by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  status: { type: "string", enum: ["DRAFT", "PUBLISHED", "SCHEDULED"] },
                  publishedAt: { type: "string", format: "date-time", description: "Required if status is SCHEDULED" },
                  categoryId: { type: "string", format: "uuid", nullable: true },
                  seriesId: { type: "string", format: "uuid", nullable: true },
                  featuredImageId: { type: "string", format: "uuid", nullable: true },
                  tagIds: { type: "array", items: { type: "string", format: "uuid" } },
                  metaTitle: { type: "string", nullable: true },
                  metaDescription: { type: "string", nullable: true },
                  canonicalUrl: { type: "string", format: "url", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Post updated successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Post not found" },
        },
      },
      delete: {
        tags: ["Posts"],
        summary: "Soft delete a post by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Post deleted successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Post not found" },
        },
      },
    },
    "/posts/search/{query}": {
      get: {
        tags: ["Posts"],
        summary: "Search posts by query",
        parameters: [
          { name: "query", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "sortBy", in: "query", schema: { type: "string" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          { name: "includeDeleted", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          200: { description: "Search results" },
        },
      },
    },
    "/posts/advanced-search": {
      get: {
        tags: ["Posts"],
        summary: "Advanced search for posts",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "searchTerm", in: "query", schema: { type: "string" } },
          { name: "sortBy", in: "query", schema: { type: "string" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          { name: "includeDeleted", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          200: { description: "Advanced search results" },
          400: { description: "Search term required" },
        },
      },
    },
    "/posts/author/{authorId}": {
      get: {
        tags: ["Posts"],
        summary: "Get posts by author",
        parameters: [
          { name: "authorId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "sortBy", in: "query", schema: { type: "string" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
        ],
        responses: {
          200: { description: "Posts by author" },
          400: { description: "Invalid author ID" },
        },
      },
    },
    "/posts/trending": {
      get: {
        tags: ["Posts"],
        summary: "Get trending posts",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "sortBy", in: "query", schema: { type: "string" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
        ],
        responses: {
          200: { description: "Trending posts" },
        },
      },
    },
    "/posts/featured": {
      get: {
        tags: ["Posts"],
        summary: "Get featured posts",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "sortBy", in: "query", schema: { type: "string" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
        ],
        responses: {
          200: { description: "Featured posts" },
        },
      },
    },
    "/posts/slug/{slug}": {
      get: {
        tags: ["Posts"],
        summary: "Get a post by slug",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Post details" },
          404: { description: "Post not found" },
        },
      },
    },
    "/posts/{id}/view": {
      post: {
        tags: ["Posts"],
        summary: "Increment post view count",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "View count incremented successfully" },
          404: { description: "Post not found" },
        },
      },
    },
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "Get all categories",
        responses: {
          200: { description: "List of categories" },
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Create a new category",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Category created successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Get a category by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Category details" },
          404: { description: "Category not found" },
        },
      },
      put: {
        tags: ["Categories"],
        summary: "Update a category by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Category updated successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Category not found" },
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Delete a category by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Category deleted successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Category not found" },
        },
      },
    },
    "/tags": {
      get: {
        tags: ["Tags"],
        summary: "Get all tags",
        responses: {
          200: { description: "List of tags" },
        },
      },
      post: {
        tags: ["Tags"],
        summary: "Create a new tag",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Tag created successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/tags/{id}": {
      get: {
        tags: ["Tags"],
        summary: "Get a tag by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Tag details" },
          404: { description: "Tag not found" },
        },
      },
      put: {
        tags: ["Tags"],
        summary: "Update a tag by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Tag updated successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Tag not found" },
        },
      },
      delete: {
        tags: ["Tags"],
        summary: "Delete a tag by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Tag deleted successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Tag not found" },
        },
      },
    },
    "/series": {
      get: {
        tags: ["Series"],
        summary: "Get all series",
        responses: {
          200: { description: "List of series" },
        },
      },
      post: {
        tags: ["Series"],
        summary: "Create a new series",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Series created successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/series/{id}": {
      get: {
        tags: ["Series"],
        summary: "Get a series by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Series details" },
          404: { description: "Series not found" },
        },
      },
      put: {
        tags: ["Series"],
        summary: "Update a series by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Series updated successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Series not found" },
        },
      },
      delete: {
        tags: ["Series"],
        summary: "Delete a series by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Series deleted successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Series not found" },
        },
      },
    },
    "/comments": {
      get: {
        tags: ["Comments"],
        summary: "Get all comments",
        parameters: [
          { name: "postId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "authorId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "parentId", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "List of comments" },
        },
      },
      post: {
        tags: ["Comments"],
        summary: "Create a new comment",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content", "postId"],
                properties: {
                  content: { type: "string" },
                  postId: { type: "string", format: "uuid" },
                  parentCommentId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Comment created successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/comments/{id}": {
      get: {
        tags: ["Comments"],
        summary: "Get a comment by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Comment details" },
          404: { description: "Comment not found" },
        },
      },
      put: {
        tags: ["Comments"],
        summary: "Update a comment by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  content: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Comment updated successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Comment not found" },
        },
      },
      delete: {
        tags: ["Comments"],
        summary: "Soft delete a comment by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Comment deleted successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Comment not found" },
        },
      },
    },
    "/likes": {
      post: {
        tags: ["Likes"],
        summary: "Like a post",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["postId"],
                properties: {
                  postId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Post liked successfully" },
          400: { description: "Invalid input or already liked" },
          401: { description: "Unauthorized" },
          404: { description: "Post not found" },
        },
      },
      delete: {
        tags: ["Likes"],
        summary: "Unlike a post",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "postId", in: "query", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Post unliked successfully" },
          400: { description: "Invalid input or not liked" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/bookmarks": {
      get: {
        tags: ["Bookmarks"],
        summary: "Get all bookmarked posts for the current user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "List of bookmarked posts" },
          401: { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Bookmarks"],
        summary: "Bookmark a post",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["postId"],
                properties: {
                  postId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Post bookmarked successfully" },
          400: { description: "Invalid input or already bookmarked" },
          401: { description: "Unauthorized" },
          404: { description: "Post not found" },
        },
      },
      delete: {
        tags: ["Bookmarks"],
        summary: "Remove a bookmark from a post",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "postId", in: "query", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Bookmark removed successfully" },
          400: { description: "Invalid input or not bookmarked" },
          401: { description: "Unauthorized" },
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
    "/newsletter/subscribe": {
      post: {
        tags: ["Newsletter"],
        summary: "Subscribe to newsletter",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  source: { type: "string" },
                  preferences: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Newsletter subscription created successfully" },
          400: { description: "Invalid input" },
          409: { description: "Already subscribed" },
        },
      },
    },
    "/newsletter/unsubscribe": {
      post: {
        tags: ["Newsletter"],
        summary: "Unsubscribe from newsletter",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" },
                  reason: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Unsubscribed successfully" },
          400: { description: "Invalid input" },
          404: { description: "Subscription not found" },
        },
      },
    },
    "/newsletter/email/{email}": {
      get: {
        tags: ["Newsletter"],
        summary: "Get newsletter subscription by email",
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string", format: "email" } }],
        responses: {
          200: { description: "Newsletter subscription details" },
          404: { description: "Subscription not found" },
        },
      },
    },
    "/newsletter/preferences/{email}": {
      put: {
        tags: ["Newsletter"],
        summary: "Update newsletter preferences",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string", format: "email" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  preferences: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Preferences updated successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          404: { description: "Subscription not found" },
        },
      },
    },
    "/newsletter": {
      get: {
        tags: ["Newsletter"],
        summary: "Get all newsletter subscriptions (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "sortBy", in: "query", schema: { type: "string" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          { name: "isActive", in: "query", schema: { type: "boolean" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of newsletter subscriptions" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/newsletter/statistics": {
      get: {
        tags: ["Newsletter"],
        summary: "Get newsletter statistics (Admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Newsletter statistics" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/newsletter/export": {
      get: {
        tags: ["Newsletter"],
        summary: "Export newsletter subscribers (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "isActive", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          200: { description: "Exported subscribers data" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/newsletter/{id}": {
      get: {
        tags: ["Newsletter"],
        summary: "Get newsletter subscription by ID (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Newsletter subscription details" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Subscription not found" },
        },
      },
      delete: {
        tags: ["Newsletter"],
        summary: "Soft delete newsletter subscription (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Newsletter subscription deleted successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Subscription not found" },
        },
      },
    },
    "/contact/submit": {
      post: {
        tags: ["Contact"],
        summary: "Submit a contact form",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "subject", "message"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  subject: { type: "string" },
                  message: { type: "string" },
                  category: { type: "string" },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Contact form submitted successfully" },
          400: { description: "Invalid input" },
        },
      },
    },
    "/contact": {
      get: {
        tags: ["Contact"],
        summary: "Get all contacts (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "sortBy", in: "query", schema: { type: "string" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          { name: "status", in: "query", schema: { type: "string", enum: ["NEW", "READ", "REPLIED", "CLOSED"] } },
          { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" } },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: { description: "List of contacts" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/contact/statistics": {
      get: {
        tags: ["Contact"],
        summary: "Get contact statistics (Admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Contact statistics" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/contact/export": {
      get: {
        tags: ["Contact"],
        summary: "Export contacts (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["NEW", "READ", "REPLIED", "CLOSED"] } },
          { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" } },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: { description: "Exported contacts data" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/contact/{id}": {
      get: {
        tags: ["Contact"],
        summary: "Get contact by ID (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Contact details" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Contact not found" },
        },
      },
      put: {
        tags: ["Contact"],
        summary: "Update contact (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["NEW", "READ", "REPLIED", "CLOSED"] },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
                  category: { type: "string" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Contact updated successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Contact not found" },
        },
      },
    },
    "/contact/{id}/reply": {
      post: {
        tags: ["Contact"],
        summary: "Reply to contact (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["replyMessage"],
                properties: {
                  replyMessage: { type: "string" },
                  internalNotes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Reply sent successfully" },
          400: { description: "Invalid input" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Contact not found" },
        },
      },
    },
    "/contact/{id}/read": {
      patch: {
        tags: ["Contact"],
        summary: "Mark contact as read (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Contact marked as read successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Contact not found" },
        },
      },
    },
    "/contact/{id}/close": {
      patch: {
        tags: ["Contact"],
        summary: "Close contact (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Contact closed successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Contact not found" },
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
  },
}

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  logger.info("Swagger UI is available at /api-docs")
}
