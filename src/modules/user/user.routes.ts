import { authenticate, authorizePermissions } from '@middlewares/auth.middleware';
import { cacheMiddleware } from '@middlewares/cache.middleware';
import { csrfErrorHandler, csrfProtection, setCsrfToken } from '@middlewares/csrf.middleware';
import { validate } from '@middlewares/validation.middleware';
import { RequestHandler, Router } from 'express';
import { UserController } from './user.controller';
import { createUserSchema, updateUserSchema, userIdSchema } from './user.validation';

export class UserRoutes {
  public router: Router;
  private userController: UserController;

  constructor() {
    this.router = Router();
    this.userController = new UserController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Temporary test endpoint (remove in production)
    this.router.get('/test', (req, res) => {
      res.json({
        message: 'User routes are working',
        cookies: req.cookies,
        headers: {
          authorization: req.headers.authorization ? 'present' : 'missing',
          'user-agent': req.headers['user-agent'],
        },
        timestamp: new Date().toISOString(),
      });
    });

    // All routes below require authentication
    this.router.use(authenticate);

    // Apply CSRF protection to routes that modify data
    this.router.use(csrfProtection as unknown as RequestHandler);
    this.router.use(setCsrfToken);
    this.router.use(csrfErrorHandler);

    // Get current user's profile
    this.router.get('/me', this.userController.getMe);

    // Get all users (Admin only)
    this.router.get(
      '/',
      authorizePermissions('user:read'),
      cacheMiddleware(60), // Cache for 60 seconds
      this.userController.getAll,
    );

    // Get user by ID (Admin only)
    this.router.get(
      '/:id',
      authorizePermissions('user:read'),
      validate(userIdSchema, 'params'),
      cacheMiddleware(60), // Cache for 60 seconds
      this.userController.getById,
    );

    // Create new user (Admin only)
    this.router.post(
      '/',
      authorizePermissions('user:create'),
      validate(createUserSchema, 'body'),
      this.userController.createUser,
    );

    // Update user by ID (Admin only)
    this.router.put(
      '/:id',
      authorizePermissions('user:update'),
      validate(userIdSchema, 'params'),
      validate(updateUserSchema, 'body'),
      this.userController.updateUser,
    );

    // Soft delete user by ID (Admin only)
    this.router.delete(
      '/:id',
      authorizePermissions('user:delete'),
      validate(userIdSchema, 'params'),
      this.userController.softDeleteUser,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
