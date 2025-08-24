import mongoose, { Schema } from "mongoose";

import { IUser, Role } from "./user.interface";

const UserSchema = new Schema<IUser>({
  first_name: { type: String , required: true},
  last_name: { type: String , required: true},
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(Role), default: Role.EMPLOYEE, required: true },
  deletedAt: { type: Date, default: null },
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);
