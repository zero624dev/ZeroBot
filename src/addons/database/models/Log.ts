import mongoose, { Schema, Document } from "mongoose";

const LogSchema: Schema = new Schema(
  {
    _id: { type: String },
    data: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  {
    _id: false,
    timestamps: false,
  },
);

export interface ILog extends Document {
  data: string;
  createdAt: Date;
}

export const LogModel = mongoose.model<ILog>("Log", LogSchema);
