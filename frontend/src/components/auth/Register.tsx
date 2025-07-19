import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { OTPVerification } from './OTPVerification';
import './Auth.css';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { signup, verifyAccount, resendOTP } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);

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

    // Basic validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await signup(
        formData.username,
        formData.email,
        formData.password,
        formData.fullName
      );
      
      if (response.status === 'success') {
        setShowOTP(true);
      } else {
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
    // Registration completed successfully, user is now logged in
    // AuthContext will handle the redirect
  };

  const handleBackToRegister = () => {
    setShowOTP(false);
    setError('');
  };

  if (showOTP) {
    return (
      <OTPVerification
        email={formData.email}
        onVerificationSuccess={handleVerificationSuccess}
        onBack={handleBackToRegister}
        onResendOTP={handleResendOTP}
        onVerifyOTP={handleOTPVerification}
      />
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-logo">Passport Buddy ✈️</h1>
        <p className="auth-tagline">Sign up to share your travel adventures</p>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
            autoComplete="name"
          />
          
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            autoComplete="username"
          />
          
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
          
          {error && <div className="auth-error">{error}</div>}
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Sending verification code...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="auth-divider">
          <span>OR</span>
        </div>
        
        <p className="auth-switch">
          Have an account?{' '}
          <button onClick={onSwitchToLogin} className="auth-link">
            Log in
          </button>
        </p>
      </div>
      
      <div className="auth-footer">
        <p>By signing up, you agree to our Terms and Privacy Policy</p>
      </div>
    </div>
  );
};