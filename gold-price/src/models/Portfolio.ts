import { Schema, model, Document, Types } from 'mongoose';

export interface IPortfolioItem {
  _id: Types.ObjectId;
  code: string;
  quantity: number;
  unit: 'chi' | 'luong' | 'gram' | 'oz';
  buyPrice: number;
  buyDate: Date;
  note?: string;
}

export interface IPortfolio extends Document {
  userId: Types.ObjectId;
  name: string;
  items: IPortfolioItem[];
  createdAt: Date;
  updatedAt: Date;
}

const portfolioItemSchema = new Schema<IPortfolioItem>(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    unit: {
      type: String,
      enum: ['chi', 'luong', 'gram', 'oz'],
      default: 'chi',
    },
    buyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    buyDate: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      maxlength: 200,
    },
  },
  { _id: true }
);

const portfolioSchema = new Schema<IPortfolio>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    items: [portfolioItemSchema],
  },
  {
    timestamps: true,
  }
);

export const Portfolio = model<IPortfolio>('Portfolio', portfolioSchema);
