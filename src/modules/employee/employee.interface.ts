import { Role } from "@modules/user/user.interface";
import { Document, Types } from "mongoose";

export interface IAvailability {
  day: string;
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface IEmployee extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  skills: string[];
  team?: string;
  availability?: IAvailability[];
  location?: string;
}