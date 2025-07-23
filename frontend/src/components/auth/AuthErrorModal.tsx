import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import authService, { type AuthError } from '../../services/auth.service';
import { BackendStatus } from '../../utils/smartFetch';
import './AuthErrorModal.css';

interface AuthErrorModalProps {
  error: string;
  errorCode?: string;
  isRecoverable?: boolean;
  onRetry: () => void;
  onGoToLogin?: () => void;
  onClose?: () => void;
}

export const AuthErrorModal: React.FC<AuthErrorModalProps> = ({
  error,
  errorCode,
  isRecoverable = true,
  onRetry,
  onGoToLogin,
  onClose
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get backend status
    setBackendStatus(authService.getBackendStatus());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  const handleCheckBackend = async () => {
    try {
      const status = await authService.refreshBackendHealth();
      setBackendStatus(status);
    } catch (error) {
      console.error('Failed to check backend health:', error);
    }
  };

  const getErrorIcon = () => {
    if (isOffline) return '📵';
    
    switch (errorCode) {
      case 'TIMEOUT': return '⏱️';
      case 'NETWORK_ERROR': return '📡';
      case 'ALL_ENDPOINTS_FAILED': return '🚨';
      case 'SERVER_ERROR': return '🔧';
      case 'UNAUTHORIZED': return '🔐';
      case 'FORBIDDEN': return '🚫';
      default: return '❌';
    }
  };

  const getErrorTitle = () => {
    if (isOffline) return 'You\'re Offline';
    
    switch (errorCode) {
      case 'TIMEOUT': return 'Connection Timeout';
      case 'NETWORK_ERROR': return 'Network Error';
      case 'ALL_ENDPOINTS_FAILED': return 'Service Unavailable';
      case 'SERVER_ERROR': return 'Server Error';
      case 'UNAUTHORIZED': return 'Session Expired';
      case 'FORBIDDEN': return 'Access Denied';
      default: return 'Connection Error';
    }
  };

  const getHelpText = () => {
    if (isOffline) {
      return 'Your device is not connected to the internet. Please check your connection and try again.';
    }
    
    switch (errorCode) {
      case 'ALL_ENDPOINTS_FAILED':
        return 'All our servers are currently experiencing issues. Our team has been notified and is working to resolve this.';
      case 'TIMEOUT':
        return 'The servers are taking too long to respond. This usually indicates a slow connection or server overload.';
      case 'NETWORK_ERROR':
        return 'There was a problem connecting to our servers. Please check your internet connection.';
      default:
        return 'Something went wrong while trying to connect. Please try again in a moment.';
    }
  };

  const getRecoveryActions = () => {
    const actions = [];

    if (isRecoverable && !isOffline) {
      actions.push(
        <button 
          key="retry"
          className="auth-modal-retry"
          onClick={handleRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <>
              <span className="spinner"></span>
              Retrying...
            </>
          ) : (
            <>
              <span className="retry-icon">🔄</span>
              Try Again
            </>
          )}
        </button>
      );
    }

    if (isOffline) {
      actions.push(
        <button 
          key="check-connection"
          className="auth-modal-secondary"
          onClick={() => {
            if (navigator.onLine) {
              setIsOffline(false);
              handleRetry();
            }
          }}
        >
          <span className="wifi-icon">📶</span>
          Check Connection
        </button>
      );
    }

    actions.push(
      <button 
        key="refresh"
        className="auth-modal-secondary"
        onClick={handleRefreshPage}
      >
        <span className="refresh-icon">🔄</span>
        Refresh Page
      </button>
    );

    if ((errorCode === 'UNAUTHORIZED' || errorCode === 'FORBIDDEN') && onGoToLogin) {
      actions.push(
        <button 
          key="login"
          className="auth-modal-login"
          onClick={onGoToLogin}
        >
          <span className="login-icon">🔐</span>
          Go to Login
        </button>
      );
    }

    return actions;
  };

  const healthyEndpoints = backendStatus.filter(s => s.isHealthy);
  const unhealthyEndpoints = backendStatus.filter(s => !s.isHealthy);

  return (
    <div className="auth-error-modal-overlay" onClick={onClose}>
      <div className="auth-error-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-error-modal-header">
          <div className="auth-error-icon">
            {getErrorIcon()}
          </div>
          
          <h2 className="auth-error-title">
            {getErrorTitle()}
          </h2>
          
          {onClose && (
            <button 
              className="auth-error-close" 
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        <div className="auth-error-modal-body">
          <p className="auth-error-message">
            {error}
          </p>
          
          <p className="auth-error-help">
            {getHelpText()}
          </p>

          {/* Offline indicator */}
          {isOffline && (
            <div className="offline-banner">
              <span className="offline-icon">📵</span>
              <span>You're currently offline</span>
            </div>
          )}

          {/* Actions */}
          <div className="auth-error-actions">
            {getRecoveryActions()}
          </div>

          {/* Advanced diagnostics */}
          <div className="auth-error-advanced">
            <button 
              className="show-advanced-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '▼' : '▶'} Advanced Diagnostics
            </button>
            
            {showAdvanced && (
              <div className="advanced-content">
                <div className="backend-status">
                  <h4>Server Status</h4>
                  
                  <button 
                    className="refresh-status-btn"
                    onClick={handleCheckBackend}
                  >
                    🔄 Refresh Status
                  </button>

                  {backendStatus.length > 0 ? (
                    <div className="status-list">
                      {healthyEndpoints.map((status, index) => (
                        <div key={index} className="status-item healthy">
                          <span className="status-icon">✅</span>
                          <span className="status-endpoint">{status.endpoint}</span>
                          <span className="status-latency">{status.latency}ms</span>
                        </div>
                      ))}
                      
                      {unhealthyEndpoints.map((status, index) => (
                        <div key={index} className="status-item unhealthy">
                          <span className="status-icon">❌</span>
                          <span className="status-endpoint">{status.endpoint}</span>
                          <span className="status-error">{status.error || 'Unavailable'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="status-loading">
                      <span className="spinner"></span>
                      Checking server status...
                    </div>
                  )}
                </div>

                <div className="connection-info">
                  <h4>Connection Info</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Online Status:</span>
                      <span className={`info-value ${isOffline ? 'offline' : 'online'}`}>
                        {isOffline ? 'Offline' : 'Online'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Error Code:</span>
                      <span className="info-value code">{errorCode || 'UNKNOWN'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Recoverable:</span>
                      <span className="info-value">{isRecoverable ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="auth-error-modal-footer">
          <p>
            Still having issues?{' '}
            <a 
              href="mailto:support@yourservice.com" 
              className="support-link"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};