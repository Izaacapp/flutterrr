import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';

interface AuthRequest extends Request {
  userId?: string;
}

export const updateProfile = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { fullName, bio, location, homeAirport, passportCountry, avatar } = req.body;
  
  if (!req.userId) {
    return next(new AppError('User not authenticated', 401));
  }

  // Build update object with only provided fields
  const updateData: any = {};
  
  if (fullName !== undefined) updateData.fullName = fullName;
  if (bio !== undefined) updateData.bio = bio;
  if (location !== undefined) updateData.location = location;
  if (homeAirport !== undefined) updateData.homeAirport = homeAirport;
  if (passportCountry !== undefined) updateData.passportCountry = passportCountry;
  if (avatar !== undefined) updateData.avatar = avatar;

  // Update user
  const user = await User.findByIdAndUpdate(
    req.userId,
    updateData,
    {
      new: true,
      runValidators: true,
      select: '-password -otp -otpExpires -resetPasswordOTP -resetPasswordOTPExpires'
    }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

export const uploadAvatar = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (!req.uploadedAvatar) {
    return next(new AppError('No avatar uploaded', 400));
  }

  // Update user with new avatar URL
  const user = await User.findByIdAndUpdate(
    req.userId,
    { avatar: req.uploadedAvatar.url },
    {
      new: true,
      runValidators: true,
      select: '-password -otp -otpExpires -resetPasswordOTP -resetPasswordOTPExpires'
    }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
      avatar: req.uploadedAvatar
    }
  });
});

export const getProfile = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.params.userId || req.userId;
  
  const user = await User.findById(userId)
    .select('-password -otp -otpExpires -resetPasswordOTP -resetPasswordOTPExpires');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});