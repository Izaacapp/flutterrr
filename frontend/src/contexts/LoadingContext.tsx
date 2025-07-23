import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);

  const setIsLoading = useCallback((loading: boolean) => {
    setLoadingCount(prev => loading ? prev + 1 : Math.max(0, prev - 1));
  }, []);

  const withLoading = useCallback(async <T,>(promise: Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await promise;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  const isLoading = loadingCount > 0;

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading, withLoading }}>
      {children}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          backgroundColor: 'var(--pb-light-periwinkle)',
          zIndex: 9999,
          animation: 'loading-progress 1s ease-out'
        }}>
          <div style={{
            height: '100%',
            width: '30%',
            backgroundColor: 'var(--pb-medium-purple)',
            animation: 'loading-slide 1s ease-in-out infinite'
          }} />
        </div>
      )}
      <style>{`
        @keyframes loading-progress {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};