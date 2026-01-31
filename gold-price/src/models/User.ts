import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IDevice {
  token: string;
  platform: 'ios' | 'android' | 'web';
  lastActive: Date;
}

export interface IPreferences {
  language: 'vi' | 'en';
  currency: 'VND' | 'USD';
  darkMode: boolean;
  notifications: {
    push: boolean;
    email: boolean;
  };
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  isPremium: boolean;
  premiumExpiry?: Date;
  preferences: IPreferences;
  devices: IDevice[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiry: {
      type: Date,
    },
    preferences: {
      language: {
        type: String,
        enum: ['vi', 'en'],
        default: 'vi',
      },
      currency: {
        type: String,
        enum: ['VND', 'USD'],
        default: 'VND',
      },
      darkMode: {
        type: Boolean,
        default: false,
      },
      notifications: {
        push: {
          type: Boolean,
          default: true,
        },
        email: {
          type: Boolean,
          default: true,
        },
      },
    },
    devices: [
      {
        token: String,
        platform: {
          type: String,
          enum: ['ios', 'android', 'web'],
        },
        lastActive: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual to check if premium is active
userSchema.virtual('isPremiumActive').get(function () {
  if (!this.isPremium) return false;
  if (!this.premiumExpiry) return false;
  return this.premiumExpiry > new Date();
});

export const User = model<IUser>('User', userSchema);
