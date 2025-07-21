import React, { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import { ForgotPassword } from './ForgotPassword';
import { ResetPassword } from './ResetPassword';
import { useToast } from '../../contexts/ToastContext';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password';

export const AuthPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [resetEmail, setResetEmail] = useState('');
  const { showToast } = useToast();

  const handlePasswordResetSuccess = () => {
    showToast('Password reset successfully! Please login with your new password.', 'success');
    setCurrentView('login');
  };

  switch (currentView) {
    case 'login':
      return (
        <Login 
          onSwitchToRegister={() => setCurrentView('register')}
          onForgotPassword={() => setCurrentView('forgot-password')}
        />
      );
    
    case 'register':
      return (
        <Register 
          onSwitchToLogin={() => setCurrentView('login')} 
        />
      );
    
    case 'forgot-password':
      return (
        <ForgotPassword
          onBack={() => setCurrentView('login')}
          onOTPSent={(email) => {
            setResetEmail(email);
            setCurrentView('reset-password');
          }}
        />
      );
    
    case 'reset-password':
      return (
        <ResetPassword
          email={resetEmail}
          onSuccess={handlePasswordResetSuccess}
          onBack={() => setCurrentView('forgot-password')}
        />
      );
    
    default:
      return <Login onSwitchToRegister={() => setCurrentView('register')} onForgotPassword={() => setCurrentView('forgot-password')} />;
  }
};