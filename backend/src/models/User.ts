import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: Schema.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  // Travel-specific fields
  homeAirport?: string;
  passportCountry?: string;
  milesFlown?: number;
  countriesVisited?: string[];
  currentLocation?: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };
  upcomingTrips?: {
    destination: string;
    startDate: Date;
    endDate: Date;
    flightNumber?: string;
  }[];
  friends?: Schema.Types.ObjectId[];
  followers?: Schema.Types.ObjectId[];
  following?: Schema.Types.ObjectId[];
  blockedUsers?: Schema.Types.ObjectId[];
  isAdmin: boolean;
  emailVerified: boolean;
  // OTP fields for email verification
  otp?: string;
  otpExpires?: Date;
  // OTP fields for password reset
  resetPasswordOTP?: string;
  resetPasswordOTPExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  avatar: String,
  bio: {
    type: String,
    maxlength: 150,
  },
  location: String,
  // Travel fields
  homeAirport: String,
  passportCountry: String,
  milesFlown: {
    type: Number,
    default: 0,
  },
  countriesVisited: [{
    type: String,
  }],
  currentLocation: {
    lat: Number,
    lng: Number,
    city: String,
    country: String,
  },
  upcomingTrips: [{
    destination: String,
    startDate: Date,
    endDate: Date,
    flightNumber: String,
  }],
  friends: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  blockedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  isAdmin: {
    type: Boolean,
    default: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  // OTP fields
  otp: {
    type: String,
    select: false,
  },
  otpExpires: {
    type: Date,
    select: false,
  },
  resetPasswordOTP: {
    type: String,
    select: false,
  },
  resetPasswordOTPExpires: {
    type: Date,
    select: false,
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const User = model<IUser>('User', userSchema);

export default User;