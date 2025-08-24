import { HTTP_STATUS } from '@config/constants';
import i18n from '@config/i18n-compat';
import { BaseController } from '@core/base.controller';
import { successResponse } from '@core/response.util';
import type { NextFunction, Request, Response } from 'express';
import { UserService } from './user.service';
import type { CreateUserInput, UpdateUserInput } from './user.validation';

export class UserController extends BaseController<unknown> {
  private userService: UserService;

  constructor() {
    const userService = new UserService();
    super(userService);
    this.userService = userService;
  }

  getMe = this.catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return successResponse(
        res,
        i18n.__('user.not_authenticated'),
        null,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }
    const user = await this.userService.findById((req.user as any)?.id);
    successResponse(res, i18n.__('user.profile_fetch_success'), user);
  });

  createUser = this.catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userData: CreateUserInput = req.body;
    const user = await this.userService.createUser(
      userData,
      (req.user as any)?.id,
      req.ip,
      req.headers['user-agent'],
    );
    successResponse(
      res,
      i18n.__('user.create_success'),
      { id: user._id, email: user.email, name: user.username, role: user.role },
      HTTP_STATUS.CREATED,
    );
  });

  updateUser = this.catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userData: UpdateUserInput = req.body;
    const updatedUser = await this.userService.updateUser(
      id,
      userData,
      (req.user as any)?.id,
      req.ip,
      req.headers['user-agent'],
    );
    successResponse(res, i18n.__('user.update_success'), updatedUser);
  });

  softDeleteUser = this.catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await this.userService.softDeleteUser(id, (req.user as any)?.id, req.ip, req.headers['user-agent']);
    successResponse(res, i18n.__('user.delete_success'), null, HTTP_STATUS.NO_CONTENT);
  });
}
