import mongoose, { Schema, Document } from "mongoose";

const ServerSchema: Schema = new Schema(
  {
    _id: { type: String },
    language: { type: String },
  },
  {
    _id: false,
    timestamps: false,
  },
);

export interface IServer extends Document {
  language: "ko" | "en";
}

export const ServerModel = mongoose.model<IServer>("Server", ServerSchema);
