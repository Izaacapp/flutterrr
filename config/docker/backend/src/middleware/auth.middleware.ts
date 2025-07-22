import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET!;

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user: any = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found. Please logout and login again.' 
      });
    }

    req.userId = user._id.toString();
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user: any = await User.findById(decoded.userId).select('-password');

    if (user) {
      req.userId = user._id.toString();
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Invalid token, but continue anyway since auth is optional
    next();
  }
};