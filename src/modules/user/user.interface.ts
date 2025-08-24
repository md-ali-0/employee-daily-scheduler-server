import { Types } from "mongoose";

export interface IAvailability {
  day: string; // e.g. "Monday"
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  email: string;
  username: string;
  password: string;
  role: Role;
  skills: string[];
  availability: IAvailability[];
  deletedAt?: Date | null;
}

export enum Role {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
}