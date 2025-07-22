import { strictDateExtraction } from "../utils/dateStrict";
import express from 'express';
import mongoose from 'mongoose';
import { emailService } from '../services/email.service';
import { env } from '../config/env';
import timeIntegrityRouter from './timeIntegrity.routes';

const router = express.Router();

// Comprehensive health check
router.get('/health', async (_req, res) => {
  const checks = {
    status: 'UP',
    timestamp: strictDateExtraction(),
    environment: process.env.NODE_ENV,
    services: {
      api: 'UP',
      database: 'UNKNOWN',
      email: 'UNKNOWN',
      storage: 'UNKNOWN'
    },
    details: {} as any
  };

  // Check MongoDB connection
  try {
    if (mongoose.connection.readyState === 1) {
      checks.services.database = 'UP';
      checks.details.database = {
        status: 'connected',
        host: mongoose.connection.host,
        name: mongoose.connection.name
      };
    } else {
      checks.services.database = 'DOWN';
      checks.details.database = {
        status: 'disconnected',
        readyState: mongoose.connection.readyState
      };
    }
  } catch (error) {
    checks.services.database = 'ERROR';
    checks.details.database = { error: (error as Error).message };
  }

  // Check email service
  const emailProvider = process.env.EMAIL_PROVIDER || 'mailtrap';
  
  if (emailProvider === 'resend' && process.env.RESEND_API_KEY) {
    checks.services.email = 'CONFIGURED';
    checks.details.email = {
      provider: 'Resend',
      configured: true,
      from: process.env.EMAIL_FROM || 'Not set'
    };
  } else if (env.MAILTRAP_TOKEN && env.MAILTRAP_ENDPOINT) {
    checks.services.email = 'CONFIGURED';
    checks.details.email = {
      provider: 'Mailtrap',
      endpoint: env.MAILTRAP_ENDPOINT,
      configured: true
    };
  } else {
    checks.services.email = 'NOT_CONFIGURED';
    checks.details.email = {
      provider: 'None',
      configured: false,
      mode: 'development'
    };
  }

  // Check storage
  checks.services.storage = env.STORAGE_TYPE === 'local' ? 'LOCAL' : 'S3';
  checks.details.storage = {
    type: env.STORAGE_TYPE,
    uploadDir: env.UPLOAD_DIR
  };

  // Overall status
  const hasErrors = Object.values(checks.services).some(
    status => status === 'DOWN' || status === 'ERROR'
  );
  
  res.status(hasErrors ? 503 : 200).json(checks);
});

// Email test endpoint
router.post('/test-email', async (req, res) => {
  try {
    const { to, testOtp } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email address required'
      });
    }

    // Generate test OTP
    const otp = testOtp || Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log('🧪 Testing email delivery...');
    console.log('Recipient:', to);
    console.log('Test OTP:', otp);
    
    // Send test email
    const result = await emailService.sendOTPEmail(to, otp);
    
    if (result) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        details: {
          to,
          otp,
          provider: process.env.EMAIL_PROVIDER === 'resend' ? 'Resend' : (env.MAILTRAP_TOKEN ? 'Mailtrap' : 'Development Mode'),
          timestamp: strictDateExtraction()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        details: {
          to,
          provider: env.MAILTRAP_TOKEN ? 'Mailtrap' : 'Development Mode'
        }
      });
    }
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      error: 'Email test failed',
      details: (error as Error).message
    });
  }
});

// Email configuration check
router.get('/email-config', (_req, res) => {
  const emailProvider = process.env.EMAIL_PROVIDER || 'mailtrap';
  
  const config = {
    configured: emailProvider === 'resend' ? !!process.env.RESEND_API_KEY : !!(env.MAILTRAP_TOKEN && env.MAILTRAP_ENDPOINT),
    provider: emailProvider === 'resend' ? 'Resend' : (env.MAILTRAP_TOKEN ? 'Mailtrap' : 'None'),
    endpoint: emailProvider === 'resend' ? 'Resend API' : (env.MAILTRAP_ENDPOINT ? 'Configured' : 'Not configured'),
    tokenSet: emailProvider === 'resend' ? !!process.env.RESEND_API_KEY : !!env.MAILTRAP_TOKEN,
    mode: process.env.NODE_ENV,
    from: process.env.EMAIL_FROM || 'Not set'
  };
  
  res.json(config);
});

// Mount time integrity routes
router.use('/', timeIntegrityRouter);

export default router;