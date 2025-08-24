import { Role } from "@modules/user/user.interface";
import { model, Schema } from "mongoose";
import { IAvailability, IEmployee } from "./employee.interface";

const AvailabilitySchema = new Schema<IAvailability>({
  day: { type: String, required: true },
  start: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  end: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
});

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    role: { type: String, enum: Role, required: true },
    skills: { type: [String], required: true },
    team: { type: String },
    availability: { type: [AvailabilitySchema], default: [] },
    location: { type: String },
  },
  { timestamps: true }
);

export const EmployeeModel = model<IEmployee>("Employee", EmployeeSchema);