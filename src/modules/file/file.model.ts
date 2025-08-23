import mongoose, { Schema } from "mongoose";
import { IFile } from "./file.interface";

const FileSchema = new Schema<IFile>({
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  path: { type: String },
  provider: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  avatarUser: { type: Schema.Types.ObjectId, ref: "User" },
  categoryThumbnail: { type: Schema.Types.ObjectId, ref: "Category" },
  tagImage: { type: Schema.Types.ObjectId, ref: "Tag" },
  seriesImage: { type: Schema.Types.ObjectId, ref: "Series" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

FileSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const FileModel = mongoose.model<IFile>("File", FileSchema);
