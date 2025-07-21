import React, { useState } from 'react';
import './Auth.css';
import authService from '../../services/auth.service';
import { useToast } from '../../contexts/ToastContext';

interface ResetPasswordProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ email, onSuccess, onBack }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(email, formData.otp, formData.newPassword, formData.confirmPassword);
      if (response.status === 'success') {
        onSuccess();
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    try {
      await authService.forgotPassword(email);
      showToast('New code sent to your email!', 'success');
    } catch (err) {
      setError('Failed to resend code');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-logo">Passport Buddy ✈️</h1>
        
        <h2 style={{ 
          fontSize: '1.5rem', 
          color: 'var(--pb-dark-purple)', 
          marginBottom: '0.5rem',
          textAlign: 'center' 
        }}>
          Create New Password
        </h2>
        
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--pb-light-purple)', 
          marginBottom: '1.5rem',
          textAlign: 'center' 
        }}>
          Enter the code sent to {email}
        </p>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="otp"
            placeholder="Enter 6-digit code"
            value={formData.otp}
            onChange={handleChange}
            required
            maxLength={6}
            pattern="[0-9]{6}"
            autoComplete="one-time-code"
          />
          
          <input
            type="password"
            name="newPassword"
            placeholder="New password"
            value={formData.newPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
          
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm new password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
          
          {error && <div className="auth-error">{error}</div>}
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="auth-links" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button 
            type="button"
            onClick={onBack} 
            className="auth-text-link"
          >
            Back
          </button>
          
          <button 
            type="button"
            onClick={handleResendOTP} 
            className="auth-text-link"
          >
            Resend code
          </button>
        </div>
      </div>
      
      <div className="auth-footer">
        <p>Your travel companion for every journey</p>
      </div>
    </div>
  );
};