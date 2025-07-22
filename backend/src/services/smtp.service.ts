import { safeStrictDateExtraction } from "../utils/dateStrict";
import nodemailer from 'nodemailer';
import { 
  VERIFICATION_EMAIL_TEMPLATE, 
  WELCOME_EMAIL_TEMPLATE, 
  PASSWORD_RESET_OTP_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE 
} from '../mailtrap/emailTemplate';

// Create SMTP transporter using Resend's SMTP settings
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY || ''
  }
});

export class SMTPEmailService {
  private static instance: SMTPEmailService;
  private from: string;

  private constructor() {
    this.from = process.env.EMAIL_FROM || 'hello@xbullet.me';
  }

  static getInstance(): SMTPEmailService {
    if (!SMTPEmailService.instance) {
      SMTPEmailService.instance = new SMTPEmailService();
    }
    return SMTPEmailService.instance;
  }

  async sendVerificationEmail(email: string, verificationToken: string, name: string) {
    try {
      console.log("📧 [SMTP] Sending verification email to:", email);
      console.log("📧 [SMTP] Verification code:", verificationToken);

      const info = await transporter.sendMail({
        from: `Passport Buddy <${this.from}>`,
        to: email,
        subject: 'Verify Your Email',
        html: VERIFICATION_EMAIL_TEMPLATE
          .replace("{verificationCode}", verificationToken)
          .replace("{name}", name),
        text: `Hello ${name},\n\nThank you for signing up! Your verification code is: ${verificationToken}\n\nThis code will expire in 15 minutes.\n\nBest regards,\nPassport Buddy Team`,
      });

      console.log('📧 [SMTP] Email sent successfully:', info.messageId);
      return { id: info.messageId };
    } catch (error) {
      console.error('📧 [SMTP] Failed to send verification email:', error);
      
      // In development, still show the code
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 [SMTP] DEVELOPMENT MODE - Verification Code:', verificationToken);
        console.log('📧 [SMTP] Error details:', error);
      }
      throw error;
    }
  }

  async sendPasswordResetOTP(email: string, otp: string, name: string) {
    try {
      console.log("📧 [SMTP] Sending password reset OTP to:", email);

      const info = await transporter.sendMail({
        from: `Passport Buddy <${this.from}>`,
        to: email,
        subject: 'Reset Your Password',
        html: PASSWORD_RESET_OTP_TEMPLATE
          .replace("{otp}", otp)
          .replace("{name}", name),
        text: `Hello ${name},\n\nYour password reset code is: ${otp}\n\nThis code will expire in 15 minutes.\n\nBest regards,\nPassport Buddy Team`,
      });

      console.log('📧 [SMTP] Password reset email sent:', info.messageId);
      return { id: info.messageId };
    } catch (error) {
      console.error('📧 [SMTP] Failed to send password reset email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    try {
      console.log("📧 [SMTP] Sending welcome email to:", email);

      const info = await transporter.sendMail({
        from: `Passport Buddy <${this.from}>`,
        to: email,
        subject: 'Welcome to Passport Buddy',
        html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name),
        text: `Welcome ${name}!\n\nThank you for verifying your email. We're excited to have you on board!\n\nBest regards,\nPassport Buddy Team`,
      });

      console.log('📧 [SMTP] Welcome email sent:', info.messageId);
      return { id: info.messageId };
    } catch (error) {
      console.error('📧 [SMTP] Failed to send welcome email:', error);
      throw error;
    }
  }

  async sendPasswordResetSuccessEmail(email: string, name: string) {
    try {
      console.log("📧 [SMTP] Sending password reset success email to:", email);

      const info = await transporter.sendMail({
        from: `Passport Buddy <${this.from}>`,
        to: email,
        subject: 'Password Reset Successful',
        html: PASSWORD_RESET_SUCCESS_TEMPLATE.replace("{name}", name),
        text: `Hello ${name},\n\nYour password has been successfully reset.\n\nIf you didn't make this change, please contact support immediately.\n\nBest regards,\nPassport Buddy Team`,
      });

      console.log('📧 [SMTP] Password reset success email sent:', info.messageId);
      return { id: info.messageId };
    } catch (error) {
      console.error('📧 [SMTP] Failed to send password reset success email:', error);
      throw error;
    }
  }
}

// Export singleton instance methods
const smtpService = SMTPEmailService.getInstance();

export const sendVerificationEmail = smtpService.sendVerificationEmail.bind(smtpService);
export const sendPasswordResetOTP = smtpService.sendPasswordResetOTP.bind(smtpService);
export const sendWelcomeEmail = smtpService.sendWelcomeEmail.bind(smtpService);
export const sendPasswordResetSuccessEmail = smtpService.sendPasswordResetSuccessEmail.bind(smtpService);