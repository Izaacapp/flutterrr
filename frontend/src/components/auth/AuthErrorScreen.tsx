import React from 'react';
import './AuthErrorScreen.css';

interface AuthErrorScreenProps {
  error: string;
  errorCode?: string;
  isRecoverable?: boolean;
  onRetry: () => void;
  onGoToLogin?: () => void;
}

export const AuthErrorScreen: React.FC<AuthErrorScreenProps> = ({
  error,
  errorCode,
  isRecoverable = true,
  onRetry,
  onGoToLogin,
}) => {
  const getErrorIcon = () => {
    switch (errorCode) {
      case 'TIMEOUT':
        return '⏱️';
      case 'NETWORK_ERROR':
        return '📡';
      case 'SERVER_ERROR':
        return '🔧';
      case 'UNAUTHORIZED':
        return '🔐';
      case 'FORBIDDEN':
        return '🚫';
      default:
        return '❌';
    }
  };

  const getErrorTitle = () => {
    switch (errorCode) {
      case 'TIMEOUT':
        return 'Connection Timed Out';
      case 'NETWORK_ERROR':
        return 'Network Connection Issue';
      case 'SERVER_ERROR':
        return 'Server Temporarily Unavailable';
      case 'UNAUTHORIZED':
        return 'Session Expired';
      case 'FORBIDDEN':
        return 'Access Denied';
      default:
        return 'Connection Error';
    }
  };

  const getHelpText = () => {
    switch (errorCode) {
      case 'TIMEOUT':
        return 'The request took too long to complete. This usually indicates a slow or unstable internet connection.';
      case 'NETWORK_ERROR':
        return 'Unable to connect to our servers. Please check your internet connection and try again.';
      case 'SERVER_ERROR':
        return 'Our servers are experiencing issues. We\'re working to resolve this as quickly as possible.';
      case 'UNAUTHORIZED':
        return 'Your session has expired for security reasons. Please log in again to continue.';
      case 'FORBIDDEN':
        return 'You don\'t have permission to access this resource. Please contact support if you believe this is an error.';
      default:
        return 'Something went wrong while trying to connect. Please try again in a moment.';
    }
  };

  return (
    <div className="auth-error-screen">
      <div className="auth-error-container">
        <div className="auth-error-icon">
          {getErrorIcon()}
        </div>
        
        <h1 className="auth-error-title">
          {getErrorTitle()}
        </h1>
        
        <p className="auth-error-message">
          {error}
        </p>
        
        <p className="auth-error-help">
          {getHelpText()}
        </p>

        <div className="auth-error-actions">
          {isRecoverable && (
            <button 
              className="auth-error-retry"
              onClick={onRetry}
              data-testid="retry-auth-button"
            >
              <span className="retry-icon">🔄</span>
              Try Again
            </button>
          )}
          
          {(errorCode === 'UNAUTHORIZED' || errorCode === 'FORBIDDEN' || !isRecoverable) && onGoToLogin && (
            <button 
              className="auth-error-login"
              onClick={onGoToLogin}
            >
              <span className="login-icon">🔐</span>
              Go to Login
            </button>
          )}
        </div>

        <div className="auth-error-footer">
          <p>
            Still having trouble?{' '}
            <a 
              href="mailto:support@yourservice.com" 
              className="auth-error-support-link"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};