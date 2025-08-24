import { authenticate } from '@middlewares/auth.middleware';
import { cacheMiddleware } from '@middlewares/cache.middleware';
import { validate } from '@middlewares/validation.middleware';
import { Router } from 'express';
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

    this.router.use(authenticate);
    
    this.router.get('/me', this.userController.getMe);

    this.router.get(
      '/',
      cacheMiddleware(60),
      this.userController.getAll,
    );

    this.router.get(
      '/:id',
      validate(userIdSchema, 'params'),
      cacheMiddleware(60),
      this.userController.getById,
    );

    this.router.post(
      '/',
      validate(createUserSchema, 'body'),
      this.userController.createUser,
    );

    this.router.put(
      '/:id',
      validate(userIdSchema, 'params'),
      validate(updateUserSchema, 'body'),
      this.userController.updateUser,
    );

    this.router.delete(
      '/:id',
      validate(userIdSchema, 'params'),
      this.userController.softDeleteUser,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
