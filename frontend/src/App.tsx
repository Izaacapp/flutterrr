import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './components/auth/AuthPage';
import { OTPVerification } from './components/auth/OTPVerification';
import { NavigationHeader } from './components/navigation/NavigationHeader';
import RightSidebar from './components/layout/RightSidebar';
import { useAuth } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { Flights } from './pages/Flights';
import { Profile } from './pages/Profile';
import { Search } from './pages/Search';
import { Notifications } from './pages/Notifications';
import { StressTestPanel } from './components/dev/StressTestPanel';

const AppContent: React.FC = () => {
  
  return (
    <div style={{ backgroundColor: 'var(--pb-background)', minHeight: '100vh' }}>
      <NavigationHeader />
      <div style={{ display: 'flex' }}>
        <main style={{ flex: 1, padding: '1rem', width: '100%' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/flights" element={<Flights />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        {/* Right Sidebar for desktop */}
        <RightSidebar />
      </div>
      
      {/* Stress Test Panel for development */}
      <StressTestPanel />
    </div>
  );
};

function App() {
  const { isAuthenticated, loading, user, logout, needsVerification, verifyAccount, resendOTP } = useAuth();
  
  console.log('App render - isAuthenticated:', isAuthenticated, 'needsVerification:', needsVerification, 'user:', user);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: 'var(--pb-background)'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid var(--pb-light-periwinkle)',
          borderTop: '3px solid var(--pb-medium-purple)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
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
      <AppContent />
    </Router>
  );
}

export default App;