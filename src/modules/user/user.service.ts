import { BaseService } from "@core/base.service";
import { IUser } from "./user.interface";
import { UserModel } from "./user.model";

export class UserService extends BaseService<IUser> {
  constructor() {
    super(UserModel);
  }

  // Override the base methods to add user-specific logic if needed
  async createUser(
    userData: any,
    changedBy?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<IUser> {
    return this.create(userData, changedBy, ipAddress, userAgent);
  }

  async updateUser(
    id: string,
    userData: any,
    changedBy?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<IUser> {
    return this.update(id, userData, changedBy, ipAddress, userAgent);
  }

  async softDeleteUser(
    id: string,
    changedBy?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<IUser> {
    return this.softDelete(id, changedBy, ipAddress, userAgent);
  }
}
