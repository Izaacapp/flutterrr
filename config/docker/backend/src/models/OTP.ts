import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import { Schema, model, Document } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
  },
  verified: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5, // Maximum 5 attempts
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Automatically delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure only one active OTP per email
otpSchema.index({ email: 1 });

const OTP = model<IOTP>('OTP', otpSchema);

export default OTP;