import { safeStrictDateExtraction } from "../utils/dateStrict";
// Unified email service that can switch between providers
import { env } from '../config/env';

// Import provider modules based on configuration
const provider = process.env.EMAIL_PROVIDER || 'mailtrap';
console.log(`📧 Using email provider: ${provider}`);

// Import the appropriate module
let emailModule: any;
if (provider === 'smtp' || provider === 'resend-smtp') {
  emailModule = require('./smtp.service');
} else if (provider === 'resend') {
  emailModule = require('./resend.service');
} else {
  emailModule = require('../mailtrap/emails');
}

// Export the appropriate functions based on provider
export const sendVerificationEmail = emailModule.sendVerificationEmail;

export const sendPasswordResetOTP = emailModule.sendPasswordResetOTP;
export const sendWelcomeEmail = emailModule.sendWelcomeEmail;
export const sendPasswordResetSuccessEmail = emailModule.sendPasswordResetSuccessEmail;

// Legacy email service interface for backward compatibility
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // For legacy compatibility, use the appropriate provider
      if (provider === 'resend' || provider === 'smtp') {
        // Use Resend for generic emails
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const { data, error } = await resend.emails.send({
          from: `Passport Buddy <${process.env.EMAIL_FROM || 'hello@xbullet.me'}>`,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });

        if (error) throw error;
        console.log('Email sent successfully:', data);
        return true;
      } else {
        // Use Mailtrap
        const { mailtrapClient, sender } = require('../mailtrap/mailtrap.config.js');
        
        const response = await mailtrapClient.send({
          from: sender,
          to: [{ email: options.to }],
          subject: options.subject,
          text: options.text,
          html: options.html,
          category: "Email"
        });

        console.log('Email sent successfully:', response);
        return true;
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      
      // In development, simulate success
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 SIMULATED EMAIL (Development Mode)');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        return true;
      }
      
      return false;
    }
  }

  async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    try {
      await sendVerificationEmail(email, otp, 'User');
      return true;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      
      // In development, simulate success
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 SIMULATED OTP EMAIL (Development Mode)');
        console.log('To:', email);
        console.log('OTP Code:', otp);
        return true;
      }
      
      return false;
    }
  }
}

export const emailService = new EmailService();