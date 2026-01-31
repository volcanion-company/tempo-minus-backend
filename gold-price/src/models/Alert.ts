import { Schema, model, Document, Types } from 'mongoose';

export interface IAlert extends Document {
  userId: Types.ObjectId;
  code: string;
  type: 'above' | 'below';
  priceType: 'buy' | 'sell';
  threshold: number;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: Date;
  triggeredPrice?: number;
  repeatAfter?: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['above', 'below'],
      required: true,
    },
    priceType: {
      type: String,
      enum: ['buy', 'sell'],
      default: 'buy',
    },
    threshold: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isTriggered: {
      type: Boolean,
      default: false,
    },
    triggeredAt: {
      type: Date,
    },
    triggeredPrice: {
      type: Number,
    },
    repeatAfter: {
      type: Number,
      default: 60, // minutes
    },
    note: {
      type: String,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for alert checking
alertSchema.index({ code: 1, isActive: 1, type: 1 });
alertSchema.index({ userId: 1, isActive: 1 });

export const Alert = model<IAlert>('Alert', alertSchema);
