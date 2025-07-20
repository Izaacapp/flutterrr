// Unified email service that can switch between providers
import { env } from '../config/env';

// Import Resend functions if using Resend
const resendModule = process.env.EMAIL_PROVIDER === 'resend' ? require('./resend.service') : null;

// Import Mailtrap functions
const mailtrapModule = require('../mailtrap/emails');

// Select the appropriate provider
const provider = process.env.EMAIL_PROVIDER || 'mailtrap';
console.log(`📧 Using email provider: ${provider}`);

// Export the appropriate functions based on provider
export const sendVerificationEmail = provider === 'resend' && resendModule 
  ? resendModule.sendVerificationEmail 
  : mailtrapModule.sendVerificationEmail;

export const sendPasswordResetOTP = provider === 'resend' && resendModule
  ? resendModule.sendPasswordResetOTP
  : mailtrapModule.sendPasswordResetOTP;

export const sendWelcomeEmail = provider === 'resend' && resendModule
  ? resendModule.sendWelcomeEmail
  : mailtrapModule.sendWelcomeEmail;

export const sendPasswordResetSuccessEmail = provider === 'resend' && resendModule
  ? resendModule.sendPasswordResetSuccessEmail
  : mailtrapModule.sendPasswordResetSuccessEmail;

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
      if (provider === 'resend' && resendModule) {
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