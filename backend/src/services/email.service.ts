import { env } from '../config/env';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private apiToken: string;
  private apiEndpoint: string;

  constructor() {
    this.apiToken = env.MAILTRAP_TOKEN || '';
    this.apiEndpoint = env.MAILTRAP_ENDPOINT || '';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Check if Mailtrap is configured
      if (!this.apiToken || !this.apiEndpoint) {
        console.log('📧 SIMULATED EMAIL SEND (Development Mode)');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Content:', options.text);
        console.log('Note: Check server logs for OTP code');
        return true; // Simulate success for development
      }

      console.log('Sending email via Mailtrap API...');
      console.log('Endpoint:', `${this.apiEndpoint}/api/send`);
      console.log('Token configured:', this.apiToken.length > 0 ? 'Yes' : 'No');
      console.log('Recipient:', options.to);
      
      // Mailtrap API v2 format
      const payload = {
        from: {
          email: "noreply@passportbuddy.dev",
          name: "Passport Buddy"
        },
        to: [
          {
            email: options.to
          }
        ],
        subject: options.subject,
        text: options.text,
        html: options.html,
        category: "OTP Verification"
      };
      
      console.log('Email payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`${this.apiEndpoint}/api/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Mailtrap API error:', response.status, errorText);
        return false;
      }

      const result = await response.json();
      console.log('Email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    const subject = 'Verify Your Email - Passport Buddy';
    const text = `Your verification code is: ${otp}. This code will expire in 10 minutes.`;
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
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✈️ Passport Buddy</h1>
            <p>Email Verification</p>
          </div>
          <div class="content">
            <h2>Welcome to Passport Buddy!</h2>
            <p>Thank you for signing up. To complete your registration, please verify your email address using the code below:</p>
            
            <div class="otp-code">${otp}</div>
            
            <div class="warning">
              <strong>Important:</strong> This verification code will expire in 10 minutes. If you didn't request this, please ignore this email.
            </div>
            
            <p>Once verified, you'll be able to:</p>
            <ul>
              <li>Track your travel destinations</li>
              <li>Share your adventures with fellow travelers</li>
              <li>Connect with the travel community</li>
            </ul>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Happy travels!<br>The Passport Buddy Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, text, html });
  }
}

export const emailService = new EmailService();