import { env } from '../config/env';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Import the existing mailtrap configuration and templates
const { sendVerificationEmail } = require('../mailtrap/emails.js');
const { mailtrapClient, sender } = require('../mailtrap/mailtrap.config.js');

class EmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Check if Mailtrap is configured
      if (!env.MAILTRAP_TOKEN || !env.MAILTRAP_ENDPOINT) {
        console.log('📧 SIMULATED EMAIL SEND (Development Mode)');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Content:', options.text);
        console.log('Note: Check server logs for OTP code');
        return true; // Simulate success for development
      }

      console.log('Sending email via Mailtrap client...');
      console.log('Recipient:', options.to);
      
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
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    try {
      // Check if Mailtrap is configured
      if (!env.MAILTRAP_TOKEN || !env.MAILTRAP_ENDPOINT) {
        console.log('📧 SIMULATED OTP EMAIL (Development Mode)');
        console.log('To:', email);
        console.log('OTP Code:', otp);
        return true;
      }

      // Use the existing sendVerificationEmail function from mailtrap/emails.js
      await sendVerificationEmail(email, otp, 'User');
      return true;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // In development, simulate success if Mailtrap fails
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 SIMULATED OTP EMAIL (Mailtrap Failed - Development Mode)');
        console.log('To:', email);
        console.log('OTP Code:', otp);
        return true;
      }
      return false;
    }
  }
}

export const emailService = new EmailService();