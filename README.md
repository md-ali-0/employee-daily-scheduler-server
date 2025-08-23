# Node.js Enterprise Server Boilerplate

A robust Node.js enterprise server boilerplate built with Express, TypeScript, Prisma, PostgreSQL, Redis, and more. Designed for scalability, maintainability, and best practices.

## Features

*   **TypeScript**: Strongly typed code for better maintainability and fewer bugs.
*   **Express.js**: Fast, unopinionated, minimalist web framework.
*   **Prisma ORM**: Next-generation ORM for Node.js and TypeScript.
*   **PostgreSQL**: Robust relational database.
*   **Redis**: In-memory data structure store, used for caching and job queues.
*   **BullMQ**: Robust, performant, and battle-tested queueing system for Node.js.
*   **JWT Authentication**: Secure user authentication with JSON Web Tokens.
*   **Role-Based Access Control (RBAC)**: Granular permissions for different user roles.
*   **Password Hashing**: Secure password storage with `bcryptjs`.
*   **Validation**: Request validation using `zod`.
*   **Error Handling**: Centralized and robust error handling.
*   **Logging**: Structured logging with `Winston`.
*   **API Documentation**: Swagger/OpenAPI for interactive API docs.
*   **Rate Limiting**: Protect against brute-force attacks and abuse.
*   **Security Middlewares**: `Helmet` for setting various HTTP headers.
*   **CORS**: Configurable Cross-Origin Resource Sharing.
*   **CSRF Protection**: Cross-Site Request Forgery protection.
*   **Internationalization (i18n)**: Support for multiple languages.
*   **File Uploads**: Handling file uploads with `Multer` and various storage options (Local, S3, Cloudinary).
*   **Feature Flags**: Dynamically enable/disable features.
*   **Health Checks**: Endpoints for monitoring application health.
*   **Metrics**: Prometheus metrics for monitoring.
*   **Sentry Integration**: Error tracking and performance monitoring.
*   **Docker & Docker Compose**: Containerization for easy deployment and local development.
*   **CI/CD**: GitHub Actions workflow for automated testing.
*   **Project Structure**: Modular and scalable architecture.
*   **Unit & Integration Tests**: Comprehensive test suite with `Jest` and `Supertest`.
*   **Pre-commit Hooks**: `Husky` and `lint-staged` for code quality.
*   **Environment Variables**: `dotenv` for managing configurations.
*   **Alias Paths**: Simplified imports with `tsconfig-paths`.

## Getting Started

### Prerequisites

*   Node.js (v20 or higher)
*   pnpm (recommended package manager)
*   Docker & Docker Compose (recommended for local development)
*   PostgreSQL database
*   Redis instance

### Installation

1.  **Clone the repository:**
    \`\`\`bash
    git clone <repository-url>
    cd node-enterprise-server
    \`\`\`

2.  **Install dependencies:**
    \`\`\`bash
    pnpm install
    \`\`\`

3.  **Set up environment variables:**
    Create a `.env` file in the project root based on `.env.example`.

    \`\`\`dotenv
    # Application
    PORT=3000
    NODE_ENV=development # development, production, test

    # Database (PostgreSQL)
    DATABASE_URL="postgresql://user:password@localhost:5432/blog_db?schema=public"

    # Redis
    REDIS_URL="redis://localhost:6379"

    # JWT
    JWT_SECRET="your_super_secret_jwt_key"
    JWT_EXPIRES_IN="1h" # e.g., 1h, 7d, 30m

    # Sentry (Optional)
    SENTRY_DSN="" # Your Sentry DSN

    # CORS
    ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173" # Comma-separated URLs

    # File Storage
    # Options: 'local', 's3', 'cloudinary'
    FILE_STORAGE_PROVIDER="local"
    # If using S3:
    AWS_ACCESS_KEY_ID=""
    AWS_SECRET_ACCESS_KEY=""
    AWS_REGION=""
    AWS_S3_BUCKET_NAME=""
    # If using Cloudinary:
    CLOUDINARY_CLOUD_NAME=""
    CLOUDINARY_API_KEY=""
    CLOUDINARY_API_SECRET=""

    # Default Admin User (for seeding)
    DEFAULT_ADMIN_EMAIL="admin@example.com"
    DEFAULT_ADMIN_PASSWORD="password123"

    # Feature Flags (JSON string)
    FEATURE_FLAGS='{"newDashboard": true, "betaSearch": false}'
    \`\`\`

4.  **Generate Prisma client:**
    \`\`\`bash
    npx prisma generate
    \`\`\`

5.  **Run database migrations:**
    \`\`\`bash
    npx prisma migrate dev --name init
    \`\`\`
    (This will create the database tables based on `prisma/schema.prisma`)

6.  **Seed the database (optional):**
    \`\`\`bash
    npm run prisma:seed
    \`\`\`
    (This will create a default admin user and some sample data)

### Running the Application

*   **Development Mode (with hot-reloading):**
    \`\`\`bash
    npm run dev
    \`\`\`
*   **Production Mode (build and start):**
    \`\`\`bash
    npm run build
    npm start
    \`\`\`

### Running with Docker Compose (Recommended for local development)

Make sure Docker and Docker Compose are installed.

1.  **Build and run services:**
    \`\`\`bash
    docker-compose up --build
    \`\`\`
    This will:
    *   Build the Node.js application image.
    *   Start PostgreSQL and Redis containers.
    *   Run Prisma migrations and seed the database inside the app container.
    *   Start the Node.js application.
    *   Start an Nginx reverse proxy.

2.  **Access the application:**
    The API will be available at `http://localhost:${PORT:-3000}/api/v1`.
    Swagger UI will be available at `http://localhost:${PORT:-3000}/api-docs`.

3.  **Stop services:**
    \`\`\`bash
    docker-compose down
    \`\`\`

## Testing

*   **Run all tests:**
    \`\`\`bash
    npm test
    \`\`\`
*   **Run tests in watch mode:**
    \`\`\`bash
    npm run test:watch
    \`\`\`
*   **Run tests with coverage report:**
    \`\`\`bash
    npm run test:coverage
    \`\`\`

## Code Style

*   **Lint and fix code:**
    \`\`\`bash
    npm run lint
    \`\`\`
*   **Format code with Prettier:**
    \`\`\`bash
    npm run format
    \`\`\`

## Project Structure

\`\`\`
.
├── src/
│   ├── app.ts                 # Express application setup
│   ├── config/                # Configuration files (DB, Redis, Sentry, Winston, Swagger, Env)
│   ├── core/                  # Core functionalities (Base classes, Error handling, Response utilities)
│   ├── jobs/                  # BullMQ job queues and workers
│   ├── middlewares/           # Express middlewares (Auth, Rate Limit, Error Handler, CORS, etc.)
│   ├── modules/               # Feature-based modules (Auth, User, Post, Category, Tag, Series, Comment, Like, Bookmark, File)
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.service.ts
│   │   │   └── auth.validation.ts
│   │   ├── user/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.routes.ts
│   │   │   └── user.service.ts
│   │   │   └── user.validation.ts
│   │   └── ... (other modules)
│   ├── routes/                # Central route registration
│   ├── services/              # Application-wide services (e.g., Feature Flag Service)
│   ├── utils/                 # Utility functions (JWT, Password, Pagination, Slug, Audit Log, Storage)
│   └── server.ts              # Application entry point
├── prisma/
│   ├── schema.prisma          # Prisma schema definition
│   └── seed.ts                # Database seeding script
├── generated/                 # Generated Prisma client (created by `npx prisma generate`)
├── tests/                     # Unit and integration tests
├── locales/                   # i18n translation files
├── scripts/                   # Utility scripts (e.g., generate-module.js)
├── .env.example               # Example environment variables
├── .eslintrc.json             # ESLint configuration
├── .prettierrc.json           # Prettier configuration
├── .husky/                    # Git hooks configuration
├── .github/                   # GitHub Actions CI/CD workflows
├── Dockerfile                 # Docker build instructions
├── docker-compose.yml         # Docker Compose configuration
├── nginx.conf                 # Nginx reverse proxy configuration
├── package.json               # Project dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Project README
\`\`\`

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.

