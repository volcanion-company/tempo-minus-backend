import { Schema, model, Document } from 'mongoose';

export interface IProvider extends Document {
  code: string;
  name: string;
  updatedAt: Date;
}

const providerSchema = new Schema<IProvider>(
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Provider = model<IProvider>('Provider', providerSchema);
