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

// Define Mongoose schema for AuditLog
export const auditLogSchema = new Schema({
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  action: { type: String, required: true },
  changedBy: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const AuditLog = model('AuditLog', auditLogSchema);
