import User from '../models/User';

// Cleanup function to remove expired unverified accounts
export const cleanupExpiredAccounts = async () => {
  try {
    const result = await User.deleteMany({
      emailVerified: false,
      otpExpires: { $lt: new Date() }
    });
    
    if (result.deletedCount > 0) {
      console.log(`✅ Cleaned up ${result.deletedCount} expired unverified accounts`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up expired accounts:', error);
  }
};

// Run cleanup every hour
export const startCleanupJob = () => {
  // Run on startup
  cleanupExpiredAccounts();
  
  // Run every hour
  setInterval(cleanupExpiredAccounts, 60 * 60 * 1000);
  
  console.log('🧹 Account cleanup job started (runs every hour)');
};