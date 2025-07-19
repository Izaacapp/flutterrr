import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { OTPVerification } from './OTPVerification';
import './Auth.css';

interface LoginProps {
  onSwitchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const { login, verifyAccount, resendOTP } = useAuth();
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData.emailOrUsername, formData.password);
      
      if (response.needsVerification) {
        // User needs to verify their email
        setUserEmail(response.user?.email || formData.emailOrUsername);
        setShowOTP(true);
      } else if (response.status !== 'success') {
        setError(response.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (otp: string) => {
    const response = await verifyAccount(otp);
    return {
      success: response.status === 'success',
      message: response.message
    };
  };

  const handleResendOTP = async () => {
    const response = await resendOTP();
    return {
      success: response.status === 'success',
      message: response.message
    };
  };

  const handleVerificationSuccess = () => {
    // Verification completed successfully, user is now logged in
    // AuthContext will handle the redirect
  };

  const handleBackToLogin = () => {
    setShowOTP(false);
    setError('');
    setUserEmail('');
  };

  if (showOTP) {
    return (
      <OTPVerification
        email={userEmail}
        onVerificationSuccess={handleVerificationSuccess}
        onBack={handleBackToLogin}
        onResendOTP={handleResendOTP}
        onVerifyOTP={handleOTPVerification}
      />
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-logo">Passport Buddy ✈️</h1>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="emailOrUsername"
            placeholder="Email or Username"
            value={formData.emailOrUsername}
            onChange={handleChange}
            required
            autoComplete="username email"
          />
          
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
          
          {error && <div className="auth-error">{error}</div>}
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div className="auth-divider">
          <span>OR</span>
        </div>
        
        <p className="auth-switch">
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="auth-link">
            Sign up
          </button>
        </p>
      </div>
      
      <div className="auth-footer">
        <p>Your travel companion for every journey</p>
      </div>
    </div>
  );
};