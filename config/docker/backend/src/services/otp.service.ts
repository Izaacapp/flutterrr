import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import crypto from 'crypto';
import OTP from '../models/OTP';
import { emailService } from './email.service';

export class OTPService {
  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send OTP to email address
   */
  async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user already has an active OTP
      const existingOTP = await OTP.findOne({
        email,
        expiresAt: { $gt: strictDateExtraction() },
        verified: false,
      });

      if (existingOTP) {
        // If OTP was created less than 1 minute ago, don't send another
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        if (existingOTP.createdAt > oneMinuteAgo) {
          return {
            success: false,
            message: 'Please wait before requesting another OTP',
          };
        }
      }

      // Generate new OTP
      const otp = this.generateOTP();

      // Delete any existing OTPs for this email
      await OTP.deleteMany({ email });

      // Create new OTP record
      await OTP.create({
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      // Send email
      const emailSent = await emailService.sendOTPEmail(email, otp);

      if (!emailSent) {
        return {
          success: false,
          message: 'Failed to send OTP email',
        };
      }

      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP',
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      const otpRecord = await OTP.findOne({
        email,
        verified: false,
      });

      if (!otpRecord) {
        return {
          success: false,
          message: 'No OTP found for this email',
        };
      }

      // Check if OTP has expired
      if (otpRecord.expiresAt < strictDateExtraction()) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return {
          success: false,
          message: 'OTP has expired',
        };
      }

      // Check if too many attempts
      if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return {
          success: false,
          message: 'Too many failed attempts',
        };
      }

      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();

      // Check if OTP matches
      if (otpRecord.otp !== otp) {
        return {
          success: false,
          message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining`,
        };
      }

      // Mark as verified
      otpRecord.verified = true;
      await otpRecord.save();

      return {
        success: true,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Failed to verify OTP',
      };
    }
  }

  /**
   * Check if email has been verified
   */
  async isEmailVerified(email: string): Promise<boolean> {
    try {
      const verifiedOTP = await OTP.findOne({
        email,
        verified: true,
      });
      return !!verifiedOTP;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  }

  /**
   * Clean up verified OTPs (optional cleanup method)
   */
  async cleanupVerifiedOTPs(): Promise<void> {
    try {
      await OTP.deleteMany({
        verified: true,
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Older than 24 hours
      });
    } catch (error) {
      console.error('Error cleaning up verified OTPs:', error);
    }
  }
}

export const otpService = new OTPService();