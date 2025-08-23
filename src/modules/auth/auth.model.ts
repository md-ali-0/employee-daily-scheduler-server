import { model, Schema } from "mongoose";


export const passwordResetSchema = new Schema({
  email: { type: String, required: true },
  otp: { type: String },
  token: { type: String },
  type: { type: String, enum: ['LINK', 'OTP', 'BOTH'], default: 'BOTH' },
  expiresAt: { type: Date },
  usedAt: { type: Date },
});

export const PasswordReset = model('PasswordReset', passwordResetSchema);