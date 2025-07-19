import React, { useState, useRef, useEffect } from 'react';
import './Auth.css';

interface OTPVerificationProps {
  email: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
  onResendOTP: () => Promise<{ success: boolean; message: string }>;
  onVerifyOTP: (otp: string) => Promise<{ success: boolean; message: string }>;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  onVerificationSuccess,
  onBack,
  onResendOTP,
  onVerifyOTP,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Handle resend cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedValues = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedValues.forEach((val, i) => {
        if (index + i < 6 && /^\d$/.test(val)) {
          newOtp[index + i] = val;
        }
      });
      setOtp(newOtp);
      
      // Focus the next empty input or the last one
      const nextIndex = Math.min(index + pastedValues.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setError('');

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await onVerifyOTP(otpString);
      if (response.success) {
        onVerificationSuccess();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');

    try {
      const response = await onResendOTP();
      if (response.success) {
        setResendCooldown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-logo">Passport Buddy ✈️</h1>
        <p className="auth-tagline">Verify your email address</p>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p>We've sent a 6-digit verification code to:</p>
          <p style={{ fontWeight: 'bold', color: '#667eea' }}>{email}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={e => handleInputChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                style={{
                  width: '50px',
                  height: '56px',
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  border: '2px solid #e1e1e1',
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9',
                  padding: '0',
                }}
                className="otp-input"
              />
            ))}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            style={{
              background: 'none',
              border: 'none',
              color: resendCooldown > 0 ? '#ccc' : '#667eea',
              textDecoration: 'underline',
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {resendLoading ? 'Sending...' : 
             resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 
             'Resend code'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ← Back to registration
          </button>
        </div>
      </div>

      <div className="auth-footer">
        <p>Check your spam folder if you don't see the email</p>
      </div>
    </div>
  );
};