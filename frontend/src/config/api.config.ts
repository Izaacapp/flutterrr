// Environment-aware API configuration
export interface ApiConfig {
  baseUrl: string;
  fallbackUrls: string[];
  timeout: number;
  retries: number;
}

export const getApiConfig = (): ApiConfig => {
  if (typeof window === 'undefined') {
    // SSR fallback
    return {
      baseUrl: 'http://localhost:3000',
      fallbackUrls: [],
      timeout: 10000,
      retries: 3,
    };
  }

  const { hostname, protocol, port } = window.location;
  const isDevelopment = 
    hostname === 'localhost' || 
    hostname === '127.0.0.1' ||
    hostname.endsWith('.local');

  if (isDevelopment) {
    return {
      baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      fallbackUrls: [
        'http://127.0.0.1:3000',
        'http://localhost:8000', // Alternative dev port
      ],
      timeout: 5000,
      retries: 2, // Fewer retries in dev
    };
  }

  // Production configuration
  const productionConfig: ApiConfig = {
    baseUrl: import.meta.env.VITE_API_URL || 'https://api.yourservice.com',
    fallbackUrls: [
      'https://failover-api.yourservice.com',
      'https://emergency-api.yourservice.com',
    ],
    timeout: 10000,
    retries: 3,
  };

  // Domain-specific overrides
  if (hostname.includes('staging')) {
    productionConfig.baseUrl = 'https://staging-api.yourservice.com';
  } else if (hostname.includes('netlify.app')) {
    productionConfig.baseUrl = import.meta.env.VITE_API_URL || 'https://api.yourservice.com';
  } else if (hostname.includes('vercel.app')) {
    productionConfig.baseUrl = import.meta.env.VITE_API_URL || 'https://api.yourservice.com';
  }

  console.log('🔧 API_CONFIG: Production config loaded', {
    hostname,
    baseUrl: productionConfig.baseUrl,
    fallbackCount: productionConfig.fallbackUrls.length
  });

  return productionConfig;
};

// Export singleton instance
export const API_CONFIG = getApiConfig();

console.log('🌐 API_CONFIG: Initialized', {
  environment: typeof window !== 'undefined' ? 
    (window.location.hostname === 'localhost' ? 'development' : 'production') : 
    'ssr',
  baseUrl: API_CONFIG.baseUrl,
  fallbackUrls: API_CONFIG.fallbackUrls,
  timeout: API_CONFIG.timeout
});