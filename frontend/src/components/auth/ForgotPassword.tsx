import React, { useState } from 'react';
import './Auth.css';
import authService from '../../services/auth.service';

interface ForgotPasswordProps {
  onBack: () => void;
  onOTPSent: (email: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onOTPSent }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      if (response.status === 'success') {
        setSuccess(true);
        onOTPSent(email);
      } else {
        setError(response.message || 'Failed to send reset code');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
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
          Reset Password
        </h2>
        
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--pb-light-purple)', 
          marginBottom: '1.5rem',
          textAlign: 'center' 
        }}>
          Enter your email and we'll send you a code to reset your password
        </p>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={success}
          />
          
          {error && <div className="auth-error">{error}</div>}
          
          {success && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--pb-ultra-light)',
              borderRadius: '8px',
              color: 'var(--pb-dark-purple)',
              fontSize: '0.875rem',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              Reset code sent! Check your email.
            </div>
          )}
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading || success}
          >
            {loading ? 'Sending...' : success ? 'Code Sent' : 'Send Reset Code'}
          </button>
        </form>
        
        <div className="auth-links">
          <button 
            type="button"
            onClick={onBack} 
            className="auth-text-link"
          >
            Back to login
          </button>
        </div>
      </div>
      
      <div className="auth-footer">
        <p>Your travel companion for every journey</p>
      </div>
    </div>
  );
};