const {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  PASSWORD_RESET_OTP_TEMPLATE,
} = require('./emailTemplate.js');
const { mailtrapClient, sender } = require('./mailtrap.config.js');

const sendVerificationEmail = async (email, verificationToken, name) => {
  const recipient = [{ email }];

  console.log('📧 Sending verification email to:', email);
  console.log('📧 From:', sender);
  console.log('📧 Verification code:', verificationToken);

  // In development mode, create a mock email service
  if (process.env.NODE_ENV === 'development' && !process.env.MAILTRAP_TOKEN) {
    console.log('\n=================================');
    console.log('📧 DEVELOPMENT MODE - EMAIL PREVIEW');
    console.log('=================================');
    console.log('To:', email);
    console.log('Subject: Verify Your Email');
    console.log('From:', sender.email);
    console.log('---------------------------------');
    console.log(`Hello ${name},\n`);
    console.log('Your verification code is:\n');
    console.log(`    🔐 ${verificationToken}\n`);
    console.log('Enter this code on the verification page.');
    console.log('This code expires in 15 minutes.');
    console.log('=================================\n');

    // Create a development email file
    const fs = require('fs');
    const path = require('path');
    const emailDir = path.join(__dirname, '../../dev-emails');
    if (!fs.existsSync(emailDir)) {
      fs.mkdirSync(emailDir, { recursive: true });
    }

    const emailContent = VERIFICATION_EMAIL_TEMPLATE.replace('{verificationCode}', verificationToken).replace(
      '{name}',
      name
    );

    const filename = `verification_${Date.now()}_${email.replace('@', '_at_')}.html`;
    fs.writeFileSync(path.join(emailDir, filename), emailContent);
    console.log(`📧 Email saved to: backend/dev-emails/${filename}`);

    return; // Don't throw error in development
  }

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: 'Verify Your Email',
      html: VERIFICATION_EMAIL_TEMPLATE.replace('{verificationCode}', verificationToken).replace('{name}', name),
      category: 'Email Verification',
    });
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error(`Failed to send verification email: ${error}`);
  }
};

const sendPasswordResetOTP = async (email, otp, name) => {
  const recipient = [{ email }];

  // In development mode, create a mock email service
  if (process.env.NODE_ENV === 'development' && !process.env.MAILTRAP_TOKEN) {
    console.log('\n=================================');
    console.log('📧 DEVELOPMENT MODE - EMAIL PREVIEW');
    console.log('=================================');
    console.log('To:', email);
    console.log('Subject: Password Reset Code');
    console.log('From:', sender.email);
    console.log('---------------------------------');
    console.log(`Hello ${name},\n`);
    console.log('Your password reset code is:\n');
    console.log(`    🔐 ${otp}\n`);
    console.log('Enter this code on the password reset page.');
    console.log('This code expires in 5 minutes.');
    console.log('=================================\n');

    // Create a development email file
    const fs = require('fs');
    const path = require('path');
    const emailDir = path.join(__dirname, '../../dev-emails');
    if (!fs.existsSync(emailDir)) {
      fs.mkdirSync(emailDir, { recursive: true });
    }

    const emailContent = PASSWORD_RESET_OTP_TEMPLATE.replace('{verificationCode}', otp).replace('{name}', name);

    const filename = `password_reset_${Date.now()}_${email.replace('@', '_at_')}.html`;
    fs.writeFileSync(path.join(emailDir, filename), emailContent);
    console.log(`📧 Email saved to: backend/dev-emails/${filename}`);

    return; // Don't throw error in development
  }

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: 'Password Reset Code',
      html: PASSWORD_RESET_OTP_TEMPLATE.replace('{verificationCode}', otp).replace('{name}', name),
      category: 'Password Reset OTP',
    });

    console.log('Password reset OTP email sent successfully', response);
  } catch (error) {
    console.error('Error sending password reset OTP email:', error);
    throw new Error(`Error sending password reset OTP email: ${error}`);
  }
};

const sendWelcomeEmail = async (email, name) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: 'Welcome to Passport Buddy!',
      html: WELCOME_EMAIL_TEMPLATE.replace('{name}', name),
      category: 'Welcome Email',
    });

    console.log('Welcome email sent successfully', response);
  } catch (error) {
    console.error(`Error sending welcome email`, error);
    throw new Error(`Error sending welcome email: ${error}`);
  }
};

const sendPasswordResetSuccessEmail = async (email, name) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: 'Password Reset Successful',
      html: PASSWORD_RESET_SUCCESS_TEMPLATE.replace('{name}', name),
      category: 'Password Reset Success',
    });

    console.log('Password reset success email sent successfully', response);
  } catch (error) {
    console.error(`Error sending password reset success email`, error);
    throw new Error(`Error sending password reset success email: ${error}`);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetOTP,
  sendWelcomeEmail,
  sendPasswordResetSuccessEmail,
};
