import { Document, Types } from "mongoose";

export interface IFile extends Document {
  _id: Types.ObjectId;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  path?: string;
  provider: string;
  uploadedBy?: Types.ObjectId;
  avatarUser?: Types.ObjectId;
  categoryThumbnail?: Types.ObjectId;
  tagImage?: Types.ObjectId;
  seriesImage?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
