const { Resend } = require('resend');
const { 
  VERIFICATION_EMAIL_TEMPLATE, 
  WELCOME_EMAIL_TEMPLATE, 
  PASSWORD_RESET_OTP_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE 
} = require('../mailtrap/emailTemplate.js');

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  private static instance: EmailService;
  private from: string;

  private constructor() {
    this.from = process.env.EMAIL_FROM || 'hello@xbullet.me';
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendVerificationEmail(email: string, verificationToken: string, name: string) {
    try {
      console.log("📧 Sending verification email to:", email);
      console.log("📧 Verification code:", verificationToken);

      const { data, error } = await resend.emails.send({
        from: `Passport Buddy <${this.from}>`,
        to: email,
        subject: 'Verify Your Email',
        html: VERIFICATION_EMAIL_TEMPLATE
          .replace("{verificationCode}", verificationToken)
          .replace("{name}", name),
        text: `Hello ${name},\n\nThank you for signing up! Your verification code is: ${verificationToken}\n\nThis code will expire in 15 minutes.\n\nBest regards,\nPassport Buddy Team`,
      });

      if (error) {
        console.error('Resend error:', error);
        // In development, still show the code
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 DEVELOPMENT MODE - Verification Code:', verificationToken);
          return;
        }
        throw error;
      }

      console.log('Email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw error;
    }
  }

  async sendPasswordResetOTP(email: string, otp: string, name: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Passport Buddy <${this.from}>`,
        to: email,
        subject: 'Password Reset Code',
        html: PASSWORD_RESET_OTP_TEMPLATE
          .replace("{verificationCode}", otp)
          .replace("{name}", name),
        text: `Hello ${name},\n\nYour password reset code is: ${otp}\n\nThis code will expire in 15 minutes.\n\nBest regards,\nPassport Buddy Team`,
      });

      if (error) {
        console.error('Resend error:', error);
        throw error;
      }

      console.log('Password reset OTP sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to send password reset OTP:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Passport Buddy <${this.from}>`,
        to: email,
        subject: 'Welcome to Passport Buddy!',
        html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name),
        text: `Welcome ${name}!\n\nThank you for joining Passport Buddy. We're excited to have you on board!\n\nBest regards,\nPassport Buddy Team`,
      });

      if (error) {
        console.error('Resend error:', error);
        throw error;
      }

      console.log('Welcome email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  async sendPasswordResetSuccessEmail(email: string, name: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Passport Buddy <${this.from}>`,
        to: email,
        subject: 'Password Reset Successful',
        html: PASSWORD_RESET_SUCCESS_TEMPLATE.replace("{name}", name),
        text: `Hello ${name},\n\nYour password has been successfully reset.\n\nIf you didn't make this change, please contact us immediately.\n\nBest regards,\nPassport Buddy Team`,
      });

      if (error) {
        console.error('Resend error:', error);
        throw error;
      }

      console.log('Password reset success email sent:', data);
      return data;
    } catch (error) {
      console.error('Failed to send password reset success email:', error);
      throw error;
    }
  }
}

// Export singleton instance methods
const emailService = EmailService.getInstance();

export const sendVerificationEmail = emailService.sendVerificationEmail.bind(emailService);
export const sendPasswordResetOTP = emailService.sendPasswordResetOTP.bind(emailService);
export const sendWelcomeEmail = emailService.sendWelcomeEmail.bind(emailService);
export const sendPasswordResetSuccessEmail = emailService.sendPasswordResetSuccessEmail.bind(emailService);