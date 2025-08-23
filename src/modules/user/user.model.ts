import mongoose, { Schema } from "mongoose";

import { IUser, IUserPermission, Role } from "./user.interface";

const UserPermissionSchema = new Schema<IUserPermission>({
  name: { type: String, required: true },
});

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(Role), required: true },
  userPermissions: { type: [UserPermissionSchema], default: [] },
  deletedAt: { type: Date, default: null },
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);
