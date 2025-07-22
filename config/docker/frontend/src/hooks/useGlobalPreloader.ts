import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import { useEffect, useState } from 'react';
import { earthPreloader } from '../utils/earthPreloader';

interface PreloaderState {
  isPreloading: boolean;
  isComplete: boolean;
  error: Error | null;
}

export const useGlobalPreloader = () => {
  const [state, setState] = useState<PreloaderState>({
    isPreloading: false,
    isComplete: false,
    error: null
  });

  useEffect(() => {
    let mounted = true;
    
    const startPreloading = async () => {
      // Check if already loaded
      if (earthPreloader.isResourcesLoaded()) {
        setState({
          isPreloading: false,
          isComplete: true,
          error: null
        });
        return;
      }

      setState(prev => ({ ...prev, isPreloading: true }));

      try {
        // Small delay to not impact initial app load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!mounted) return;

        await earthPreloader.preloadResources();
        
        if (mounted) {
          setState({
            isPreloading: false,
            isComplete: true,
            error: null
          });
        }
      } catch (error) {
        console.warn('Earth preloader failed:', error);
        if (mounted) {
          setState({
            isPreloading: false,
            isComplete: false,
            error: error instanceof Error ? error : new Error('Preload failed')
          });
        }
      }
    };

    // Start preloading in the background
    startPreloading();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
};

// Global hook to check if resources are ready
export const useEarthResourcesReady = () => {
  const [isReady, setIsReady] = useState(earthPreloader.isResourcesLoaded());

  useEffect(() => {
    if (isReady) return;

    const checkReadiness = () => {
      if (earthPreloader.isResourcesLoaded()) {
        setIsReady(true);
      }
    };

    // Poll for readiness (lightweight since it's just checking a boolean)
    const interval = setInterval(checkReadiness, 100);
    
    return () => clearInterval(interval);
  }, [isReady]);

  return isReady;
};