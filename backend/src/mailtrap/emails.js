"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetSuccessEmail = exports.sendPasswordResetOTP = exports.sendWelcomeEmail = exports.sendVerificationEmail = void 0;
const email_service_1 = require("../services/email.service");
const sendVerificationEmail = async (email, otp, name) => {
    const subject = 'Verify Your Email - Passport Buddy';
    const text = `Hi ${name}, Your verification code is: ${otp}. This code will expire in 24 hours.`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✈️ Passport Buddy</h1>
          <p>Email Verification</p>
        </div>
        <div class="content">
          <h2>Hi ${name}!</h2>
          <p>Thank you for signing up. Please verify your email address using the code below:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p>This code will expire in 24 hours.</p>
          
          <p>Happy travels!<br>The Passport Buddy Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
    return email_service_1.emailService.sendEmail({ to: email, subject, text, html });
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendWelcomeEmail = async (email, name) => {
    const subject = 'Welcome to Passport Buddy!';
    const text = `Hi ${name}, Welcome to Passport Buddy! Your email has been verified successfully.`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✈️ Welcome to Passport Buddy!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name}!</h2>
          <p>Your email has been verified successfully. You're now ready to:</p>
          <ul>
            <li>Track your travel destinations</li>
            <li>Share your adventures</li>
            <li>Connect with fellow travelers</li>
          </ul>
          <p>Happy travels!<br>The Passport Buddy Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
    return email_service_1.emailService.sendEmail({ to: email, subject, text, html });
};
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendPasswordResetOTP = async (email, otp, name) => {
    const subject = 'Password Reset - Passport Buddy';
    const text = `Hi ${name}, Your password reset code is: ${otp}. This code will expire in 5 minutes.`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #e74c3c; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hi ${name}!</h2>
          <p>You requested to reset your password. Use the code below:</p>
          
          <div class="otp-code">${otp}</div>
          
          <div class="warning">
            <strong>Important:</strong> This code will expire in 5 minutes. If you didn't request this, please ignore this email.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
    return email_service_1.emailService.sendEmail({ to: email, subject, text, html });
};
exports.sendPasswordResetOTP = sendPasswordResetOTP;
const sendPasswordResetSuccessEmail = async (email, name) => {
    const subject = 'Password Reset Successful - Passport Buddy';
    const text = `Hi ${name}, Your password has been reset successfully.`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Password Reset Successful</h1>
        </div>
        <div class="content">
          <h2>Hi ${name}!</h2>
          <div class="success">
            Your password has been reset successfully. You can now log in with your new password.
          </div>
          <p>If you didn't make this change, please contact our support team immediately.</p>
        </div>
      </div>
    </body>
    </html>
  `;
    return email_service_1.emailService.sendEmail({ to: email, subject, text, html });
};
exports.sendPasswordResetSuccessEmail = sendPasswordResetSuccessEmail;
