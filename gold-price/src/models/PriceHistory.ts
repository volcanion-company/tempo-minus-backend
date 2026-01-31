import { Schema, model, Document } from 'mongoose';

export interface IPriceHistory extends Document {
  code: string;
  buy: number;
  sell: number;
  changeBuy: number;
  changeSell: number;
  currency: 'VND' | 'USD';
  recordedAt: Date;
  period: 'minute' | 'hour' | 'day' | 'week' | 'month';
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

const priceHistorySchema = new Schema<IPriceHistory>(
  {
    code: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
      trim: true,
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
    recordedAt: {
      type: Date,
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ['minute', 'hour', 'day', 'week', 'month'],
      default: 'minute',
      index: true,
    },
    open: Number,
    high: Number,
    low: Number,
    close: Number,
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound indexes for efficient queries
priceHistorySchema.index({ code: 1, recordedAt: -1 });
priceHistorySchema.index({ code: 1, period: 1, recordedAt: -1 });

// TTL index - Auto delete raw minute data older than 90 days
priceHistorySchema.index(
  { recordedAt: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60,
    partialFilterExpression: { period: 'minute' },
  }
);

export const PriceHistory = model<IPriceHistory>('PriceHistory', priceHistorySchema);
