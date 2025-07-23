import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { AuthPage } from './components/auth/AuthPage';
import { OTPVerification } from './components/auth/OTPVerification';
import { AuthErrorScreen } from './components/auth/AuthErrorScreen';
import { FullPageSpinner } from './components/auth/FullPageSpinner';
import { NavigationHeader } from './components/navigation/NavigationHeader';
import RightSidebar from './components/layout/RightSidebar';
import { useAuth } from './contexts/AuthContext';
import { useGlobalPreloader } from './hooks/useGlobalPreloader';
import { SocketProvider } from './contexts/SocketContext';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Flights = lazy(() => import('./pages/Flights').then(module => ({ default: module.Flights })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Search = lazy(() => import('./pages/Search').then(module => ({ default: module.Search })));
const Explore = lazy(() => import('./pages/Explore').then(module => ({ default: module.Explore })));
const Earth = lazy(() => import('./pages/Earth').then(module => ({ default: module.Earth })));
const Notifications = lazy(() => import('./pages/Notifications').then(module => ({ default: module.Notifications })));
const Statistics = lazy(() => import('./pages/Statistics').then(module => ({ default: module.Statistics })));
const StressTestPanel = lazy(() => import('./components/dev/StressTestPanel').then(module => ({ default: module.StressTestPanel })));

const AppContent: React.FC = () => {
  // Start preloading resources in background
  const preloaderState = useGlobalPreloader();
  const [showSidebar, setShowSidebar] = useState(false);
  
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  return (
    <div style={{ backgroundColor: 'var(--pb-background)', minHeight: '100vh' }}>
      <NavigationHeader onToggleSidebar={toggleSidebar} />
      <div style={{ display: 'flex' }}>
        <main style={{ 
          flex: 1, 
          padding: '1rem', 
          width: '100%',
          transition: 'opacity 0.2s ease-in-out' 
        }}>
          <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '3px solid var(--pb-light-periwinkle)', 
                borderTop: '3px solid var(--pb-medium-purple)', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite' 
              }} />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/earth" element={<Earth />} />
              <Route path="/flights" element={<Flights />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      
      {/* Right Sidebar - Slide out panel */}
      {showSidebar && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              top: '60px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998,
              animation: 'fadeIn 0.3s ease-out'
            }}
            onClick={() => setShowSidebar(false)}
          />
          
          <div style={{
            position: 'fixed',
            top: '60px',
            right: 0,
            width: '300px',
            height: 'calc(100vh - 60px)',
            backgroundColor: 'white',
            boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
            zIndex: 999,
            overflowY: 'auto',
            overflowX: 'hidden',
            animation: 'slideIn 0.3s cubic-bezier(0.0, 0.0, 0.2, 1)'
          }}>
            <RightSidebar />
          </div>
        </>
      )}
      
      {/* Stress Test Panel for development */}
      <Suspense fallback={null}>
        <StressTestPanel />
      </Suspense>
      
      {/* CSS for animations */}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

function App() {
  const { 
    isAuthenticated, 
    loading, 
    user, 
    logout, 
    needsVerification, 
    verifyAccount, 
    resendOTP,
    error,
    errorCode,
    isRecoverable,
    retryAuth,
    clearError
  } = useAuth();
  
  // Remove excessive logging in production
  if (import.meta.env.DEV) {
    console.log('App render - isAuthenticated:', isAuthenticated, 'needsVerification:', needsVerification, 'user:', user);
  }

  // Show loading spinner during auth verification
  if (loading) {
    return <FullPageSpinner />;
  }

  // Show error screen if there's an auth error
  if (error) {
    return (
      <AuthErrorScreen
        error={error}
        errorCode={errorCode || undefined}
        isRecoverable={isRecoverable}
        onRetry={retryAuth}
        onGoToLogin={() => {
          clearError();
          logout();
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Check if user needs to verify their email
  if (needsVerification && user) {
    return (
      <OTPVerification
        email={user.email}
        onVerificationSuccess={() => {
          // Verification success is handled by AuthContext
        }}
        onBack={logout}
        onResendOTP={async () => {
          const response = await resendOTP();
          return {
            success: response.status === 'success' || response.success === true,
            message: response.message
          };
        }}
        onVerifyOTP={async (otp: string) => {
          const response = await verifyAccount(otp);
          return {
            success: response.status === 'success' || response.success === true,
            message: response.message
          };
        }}
      />
    );
  }

  return (
    <Router>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </Router>
  );
}

export default App;