import { Schema, model, Document } from 'mongoose';

export interface IPrice extends Document {
  code: string;
  name: string;
  buy: number;
  sell: number;
  changeBuy: number;
  changeSell: number;
  currency: 'VND' | 'USD';
  source: string;
  updatedAt: Date;
  createdAt: Date;
}

const priceSchema = new Schema<IPrice>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    buy: {
      type: Number,
      required: true,
      min: 0,
    },
    sell: {
      type: Number,
      required: true,
      min: 0,
    },
    changeBuy: {
      type: Number,
      default: 0,
    },
    changeSell: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      enum: ['VND', 'USD'],
      required: true,
    },
    source: {
      type: String,
      default: 'vang.today',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for efficient queries
priceSchema.index({ updatedAt: -1 });
priceSchema.index({ currency: 1, updatedAt: -1 });

export const Price = model<IPrice>('Price', priceSchema);
