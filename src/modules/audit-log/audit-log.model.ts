import mongoose, { Schema } from "mongoose";
import { IAuditLog } from "./audit-log.interface";


const AuditLogSchema = new Schema<IAuditLog>({
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  action: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  changedBy: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  userId: { type: String },
  postId: { type: String },
  fileId: { type: String },
  commentId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const AuditLogModel = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
