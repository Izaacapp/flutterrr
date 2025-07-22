import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import generateOtp from '../utils/generateOtp';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetOTP, sendPasswordResetSuccessEmail } from '../services/email.service';
import { authenticate } from '../middleware/auth';

const router = Router();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_COOKIE_EXPIRES_IN = process.env.JWT_COOKIE_EXPIRES_IN || '7';

// Extended Request interface for authenticated routes
interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

// Generate JWT token
const signToken = (id: string): string => {
  return jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

// Create and send token with response
const createSendToken = (user: IUser, statusCode: number, res: Response, message: string) => {
  const token = signToken((user as any)._id.toString());
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  };

  res.cookie('token', token, cookieOptions);
  
  // Remove sensitive data
  user.password = undefined as any;
  user.otp = undefined;
  user.otpExpires = undefined;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpires = undefined;

  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    data: {
      user,
    },
  });
};

// Signup
router.post('/signup', catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { fullName, email, password, passwordConfirm, username } = req.body;

  // Check if all required fields are provided
  if (!fullName || !email || !password || !username) {
    return next(new AppError('All fields are required', 400));
  }

  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });

  if (existingUser) {
    return next(new AppError(
      existingUser.email === email ? 'Email already registered' : 'Username already taken', 
      400
    ));
  }

  // Special case for test account on xbullet.me
  const isSpecialAccount = email === 'izaacap@gmail.com' && process.env.NODE_ENV === 'production';
  const otp = isSpecialAccount ? '111111' : generateOtp();
  const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const newUser = await User.create({
    fullName,
    username,
    email,
    password,
    emailVerified: false,
    otp,
    otpExpires,
  });

  try {
    // Send verification email
    await sendVerificationEmail(newUser.email, otp, newUser.fullName);

    // In development, include OTP in response for easier testing
    if (process.env.NODE_ENV === 'development') {
      const token = signToken((newUser as any)._id.toString());
      
      // Remove sensitive data except OTP for dev
      newUser.password = undefined as any;
      newUser.otpExpires = undefined;
      
      res.status(201).json({
        status: 'success',
        message: 'Registration Successful. Check your email for OTP verification',
        token,
        data: {
          user: newUser,
          devOTP: otp // Include OTP for development testing
        },
      });
    } else {
      createSendToken(
        newUser,
        201,
        res,
        'Registration Successful. Check your email for OTP verification'
      );
    }
  } catch (error) {
    await User.findByIdAndDelete(newUser._id);
    return next(
      new AppError(
        'There is an error creating the account. Please try again later!',
        500
      )
    );
  }
}));

// Verify Account
router.post('/verify-account', authenticate, catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { otp } = req.body;

  if (!otp) {
    return next(new AppError('OTP is required for verification', 400));
  }

  const user = await User.findById(req.userId).select('+otp +otpExpires');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.otp !== otp) {
    return next(new AppError('Invalid OTP', 400));
  }

  if (Date.now() > user.otpExpires!.getTime()) {
    return next(new AppError('OTP has expired. Please request a new OTP', 400));
  }

  user.emailVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save({ validateBeforeSave: false });

  try {
    // Send welcome email after successful verification
    await sendWelcomeEmail(user.email, user.fullName);
  } catch (error) {
    console.log('Error sending welcome email:', error);
    // Don't fail the verification if welcome email fails
  }

  createSendToken(user, 200, res, 'Email has been verified successfully');
}));

// Resend OTP
router.post('/resend-otp', authenticate, catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return next(new AppError('User Not Found', 404));
  }

  if (user.emailVerified) {
    return next(new AppError('This account is already verified', 400));
  }

  // Special case for test account on xbullet.me
  const isSpecialAccount = user.email === 'izaacap@gmail.com' && process.env.NODE_ENV === 'production';
  const otp = isSpecialAccount ? '111111' : generateOtp();
  const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.otp = otp;
  user.otpExpires = otpExpires;

  await user.save({ validateBeforeSave: false });

  try {
    // Send verification email
    await sendVerificationEmail(user.email, otp, user.fullName);

    res.status(200).json({
      status: 'success',
      message: 'A new OTP has been sent to your email',
    });
  } catch (error) {
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There is an error sending email. Try again later!', 500)
    );
  }
}));

// Login
router.post('/login', catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  console.log('Login request body:', req.body);
  const { email, username, password } = req.body;
  
  // Allow login with either email or username
  const loginField = email || username;
  
  if (!loginField || !password) {
    return next(new AppError('Please provide email/username and password', 400));
  }

  // Check if loginField is email or username
  const query = email 
    ? { email: email.toLowerCase() } 
    : { username: username.toLowerCase() };
    
  const user = await User.findOne(query).select('+password +otp +otpExpires');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect credentials', 401));
  }

  // Check if user is verified
  if (!user.emailVerified) {
    // Generate new OTP if current one is expired or doesn't exist
    let otp = user.otp;
    let needsNewOtp = false;

    if (!user.otp || !user.otpExpires || Date.now() > user.otpExpires.getTime()) {
      // Special case for test account on xbullet.me
      const isSpecialAccount = user.email === 'izaacap@gmail.com' && process.env.NODE_ENV === 'production';
      otp = isSpecialAccount ? '111111' : generateOtp();
      const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      user.otp = otp;
      user.otpExpires = otpExpires;
      needsNewOtp = true;

      await user.save({ validateBeforeSave: false });
    }

    // Send OTP email if new OTP was generated
    if (needsNewOtp) {
      try {
        await sendVerificationEmail(user.email, otp!, user.fullName);
      } catch (error) {
        console.log('Error sending verification email:', error);
        // Continue even if email fails
      }
    }

    // Create token for authentication but indicate verification needed
    const token = signToken((user as any)._id.toString());
    const cookieOptions = {
      expires: new Date(
        Date.now() + parseInt(JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    };

    res.cookie('token', token, cookieOptions);

    // Clean user object
    user.password = undefined as any;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    return res.status(200).json({
      status: 'success',
      message: needsNewOtp
        ? 'Please verify your email. A new OTP has been sent to your email.'
        : 'Please verify your email with the OTP sent earlier.',
      needsVerification: true, // Flag for frontend to redirect to OTP screen
      token,
      data: {
        user,
      },
    });
  }

  createSendToken(user, 200, res, 'Login Successful');
}));

// Logout
router.post('/logout', catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.',
  });
}));

// Forgot Password
router.post('/forgot-password', catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('No User found with that email', 404));
  }

  // Generate OTP instead of token
  // Special case for test account on xbullet.me
  const isSpecialAccount = user.email === 'izaacap@gmail.com' && process.env.NODE_ENV === 'production';
  const otp = isSpecialAccount ? '111111' : generateOtp();
  const resetExpires = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || '5') * 60 * 1000));

  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpires = resetExpires;

  await user.save({ validateBeforeSave: false });

  try {
    // Send OTP via email
    await sendPasswordResetOTP(user.email, otp, user.fullName);

    res.status(200).json({
      status: 'success',
      message: 'Password reset OTP has been sent to your email (valid for 5 minutes)',
    });
  } catch (error) {
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
}));

// Reset Password
router.post('/reset-password', catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp, password, passwordConfirm } = req.body;

  if (!email || !otp || !password || !passwordConfirm) {
    return next(new AppError('Email, OTP, and both password fields are required', 400));
  }

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  const user = await User.findOne({
    email,
    resetPasswordOTP: otp,
    resetPasswordOTPExpires: { $gt: Date.now() },
  }).select('+resetPasswordOTP +resetPasswordOTPExpires');

  if (!user) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  user.password = password;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpires = undefined;

  await user.save();

  try {
    // Send password reset success email
    await sendPasswordResetSuccessEmail(user.email, user.fullName);
  } catch (error) {
    console.log('Error sending password reset success email:', error);
    // Don't fail the reset if email fails
  }

  createSendToken(user, 200, res, 'Password reset successfully');
}));

// Change Password
router.post('/change-password', authenticate, catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return next(new AppError('All password fields are required', 400));
  }

  const user = await User.findById(req.userId).select('+password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Incorrect current password', 400));
  }

  if (newPassword !== newPasswordConfirm) {
    return next(
      new AppError('New password and confirm password do not match', 400)
    );
  }

  user.password = newPassword;

  await user.save();

  createSendToken(user, 200, res, 'Password changed successfully');
}));

// Check authentication status
router.get('/check-auth', authenticate, catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await User.findById(req.userId).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
}));

// Verify token endpoint (kept for backward compatibility)
router.get('/verify', authenticate, catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await User.findById(req.userId).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      homeAirport: user.homeAirport,
      passportCountry: user.passportCountry,
      milesFlown: user.milesFlown,
      countriesVisited: user.countriesVisited,
      emailVerified: user.emailVerified
    }
  });
}));

export default router;