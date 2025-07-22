import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useDevMode = () => {
  const { user } = useAuth();
  const [isDevMode, setIsDevMode] = useState(false);
  
  useEffect(() => {
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const devParam = urlParams.get('dev');
    
    // Check localStorage for persistent dev mode
    const storedDevMode = localStorage.getItem('passport_buddy_dev_mode');
    
    // Check if user is allowed
    const ALLOWED_EMAILS = ['izaacap@gmail.com'];
    const isAllowedUser = user && ALLOWED_EMAILS.includes(user.email);
    
    // Enable dev mode if:
    // 1. User is in allowed list
    // 2. URL has ?dev=letmein123
    // 3. Dev mode was previously enabled in localStorage
    if (isAllowedUser || devParam === 'letmein123' || storedDevMode === 'true') {
      setIsDevMode(true);
      
      // Store in localStorage if enabled via URL
      if (devParam === 'letmein123') {
        localStorage.setItem('passport_buddy_dev_mode', 'true');
      }
    }
  }, [user]);
  
  const disableDevMode = () => {
    setIsDevMode(false);
    localStorage.removeItem('passport_buddy_dev_mode');
  };
  
  return { isDevMode, disableDevMode };
};