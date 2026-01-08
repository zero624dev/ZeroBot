import mongoose, { Schema, Document } from "mongoose";

const FarmSlot = new mongoose.Schema(
  {
    crop: { type: mongoose.Schema.Types.String, required: false },
    plantedAt: { type: mongoose.Schema.Types.Number, required: true }
  },
  {
    _id: false,
    timestamps: false
  }
);

const InventorySlot = new Schema(
  {
    id: { type: Schema.Types.String, required: false },
    count: { type: Schema.Types.Number, required: true }
  },
  {
    _id: false,
    timestamps: false
  }
);

const GameSchema = new Schema(
  {
    _id: { type: Schema.Types.String, required: true },
    wallet: { type: Schema.Types.Number, required: true, default: 0 },
    stock: { type: [InventorySlot], required: true, default: [] },
    inventory: { type: [InventorySlot], required: true, default: [] },
    farm: { type: [FarmSlot], required: true, default: [] },
    lastVote: { type: Schema.Types.Number, required: false },
  },
  {
    _id: false,
    timestamps: true
  }
);

export interface IGame extends Document {
  _id: number;
  wallet: number;
  stock: {
    id: string;
    count: number;
  }[];
  inventory: {
    id: string;
    count: number;
  }[];
  farm: {
    crop: string;
    plantedAt: number;
  }[];
  lastVote?: number;
}

export const GameModel = mongoose.model<IGame>('Game', GameSchema);