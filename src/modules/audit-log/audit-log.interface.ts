import { Document } from "mongoose";

export interface IAuditLog extends Document {
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  changedBy?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId?: string;
  postId?: string;
  fileId?: string;
  commentId?: string;
  createdAt: Date;
}

