import { API_CONFIG } from '../config/api.config';

export interface SmartFetchOptions extends RequestInit {
  timeout?: number;
  skipHealthCheck?: boolean;
  skipFallback?: boolean;
}

export interface BackendStatus {
  isHealthy: boolean;
  endpoint: string;
  latency?: number;
  error?: string;
}

export class SmartFetchError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean,
    public allEndpointsFailed: boolean = false
  ) {
    super(message);
    this.name = 'SmartFetchError';
  }
}

class SmartFetch {
  private healthCache = new Map<string, { healthy: boolean; timestamp: number; latency: number }>();
  private readonly HEALTH_CACHE_TTL = 30000; // 30 seconds

  async checkBackendHealth(endpoint: string, timeout = 2000): Promise<BackendStatus> {
    const cacheKey = endpoint;
    const cached = this.healthCache.get(cacheKey);
    
    // Return cached result if fresh
    if (cached && Date.now() - cached.timestamp < this.HEALTH_CACHE_TTL) {
      return {
        isHealthy: cached.healthy,
        endpoint,
        latency: cached.latency
      };
    }

    const startTime = Date.now();
    
    try {
      console.log(`🏥 HEALTH_CHECK: Testing ${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${endpoint}/health`, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'User-Agent': 'AuthService/HealthCheck'
        }
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      const isHealthy = response.ok;
      
      // Cache the result
      this.healthCache.set(cacheKey, {
        healthy: isHealthy,
        timestamp: Date.now(),
        latency
      });
      
      console.log(`${isHealthy ? '✅' : '❌'} HEALTH_CHECK: ${endpoint} - ${latency}ms`);
      
      return {
        isHealthy,
        endpoint,
        latency: isHealthy ? latency : undefined
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error(`💀 HEALTH_CHECK: ${endpoint} failed - ${latency}ms`, error);
      
      // Cache failure
      this.healthCache.set(cacheKey, {
        healthy: false,
        timestamp: Date.now(),
        latency: latency
      });
      
      return {
        isHealthy: false,
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async findHealthyEndpoint(skipHealthCheck = false): Promise<string> {
    const endpoints = [API_CONFIG.baseUrl, ...API_CONFIG.fallbackUrls];
    
    if (skipHealthCheck) {
      console.log('🚀 SMART_FETCH: Skipping health check, using primary endpoint');
      return endpoints[0];
    }
    
    console.log('🔍 SMART_FETCH: Finding healthy endpoint from', endpoints.length, 'options');
    
    // Check all endpoints in parallel
    const healthChecks = await Promise.allSettled(
      endpoints.map(endpoint => this.checkBackendHealth(endpoint))
    );
    
    // Find first healthy endpoint
    for (let i = 0; i < healthChecks.length; i++) {
      const result = healthChecks[i];
      if (result.status === 'fulfilled' && result.value.isHealthy) {
        console.log(`✅ SMART_FETCH: Using healthy endpoint ${result.value.endpoint}`);
        return result.value.endpoint;
      }
    }
    
    // If no endpoints are healthy, return primary for error handling
    console.warn('💀 SMART_FETCH: No healthy endpoints found, using primary for error reporting');
    return endpoints[0];
  }

  async smartFetch(
    input: RequestInfo | URL,
    options: SmartFetchOptions = {}
  ): Promise<Response> {
    const {
      timeout = API_CONFIG.timeout,
      skipHealthCheck = false,
      skipFallback = false,
      ...fetchOptions
    } = options;
    
    let endpoint: string;
    let allEndpoints: string[];
    
    if (skipFallback) {
      endpoint = API_CONFIG.baseUrl;
      allEndpoints = [endpoint];
    } else {
      endpoint = await this.findHealthyEndpoint(skipHealthCheck);
      allEndpoints = [API_CONFIG.baseUrl, ...API_CONFIG.fallbackUrls];
    }
    
    const errors: Array<{ endpoint: string; error: Error }> = [];
    const url = new URL(input.toString(), endpoint);
    
    console.log(`🌐 SMART_FETCH: ${fetchOptions.method || 'GET'} ${url.toString()}`);
    
    // Try the selected endpoint first
    try {
      const response = await this.attemptFetch(url.toString(), { timeout, ...fetchOptions });
      console.log(`✅ SMART_FETCH: Success with ${endpoint}`);
      return response;
    } catch (error) {
      console.error(`❌ SMART_FETCH: Failed with ${endpoint}:`, error);
      errors.push({ endpoint, error: error as Error });
    }
    
    // If primary failed and fallback not skipped, try other endpoints
    if (!skipFallback && allEndpoints.length > 1) {
      const remainingEndpoints = allEndpoints.filter(ep => ep !== endpoint);
      
      for (const fallbackEndpoint of remainingEndpoints) {
        try {
          const fallbackUrl = new URL(input.toString(), fallbackEndpoint);
          console.log(`🔄 SMART_FETCH: Trying fallback ${fallbackEndpoint}`);
          
          const response = await this.attemptFetch(fallbackUrl.toString(), { timeout, ...fetchOptions });
          console.log(`✅ SMART_FETCH: Success with fallback ${fallbackEndpoint}`);
          return response;
        } catch (error) {
          console.error(`❌ SMART_FETCH: Fallback ${fallbackEndpoint} failed:`, error);
          errors.push({ endpoint: fallbackEndpoint, error: error as Error });
        }
      }
    }
    
    // All endpoints failed
    console.error(`💀 SMART_FETCH: All ${errors.length} endpoints failed`);
    
    // Determine error type based on the failures
    const lastError = errors[errors.length - 1]?.error;
    
    if (lastError?.name === 'AbortError') {
      throw new SmartFetchError(
        'Request timed out on all servers. Please check your connection.',
        'TIMEOUT',
        true,
        true
      );
    }
    
    if (lastError?.message?.includes('Failed to fetch')) {
      throw new SmartFetchError(
        'Unable to connect to any server. Please check your internet connection.',
        'NETWORK_ERROR',
        true,
        true
      );
    }
    
    throw new SmartFetchError(
      'All servers are currently unavailable. Please try again later.',
      'ALL_ENDPOINTS_FAILED',
      true,
      true
    );
  }

  private async attemptFetch(url: string, options: RequestInit & { timeout: number }): Promise<Response> {
    const { timeout, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new SmartFetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          'HTTP_ERROR',
          response.status >= 500, // 5xx errors are recoverable
          false
        );
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof SmartFetchError) {
        throw error;
      }
      
      throw error;
    }
  }

  // Clear health cache (useful for testing or manual refresh)
  clearHealthCache(): void {
    this.healthCache.clear();
    console.log('🧹 SMART_FETCH: Health cache cleared');
  }

  // Get current health status for all endpoints
  async getEndpointHealth(): Promise<BackendStatus[]> {
    const endpoints = [API_CONFIG.baseUrl, ...API_CONFIG.fallbackUrls];
    const results = await Promise.allSettled(
      endpoints.map(endpoint => this.checkBackendHealth(endpoint))
    );
    
    return results
      .map((result, index) => 
        result.status === 'fulfilled' 
          ? result.value 
          : { isHealthy: false, endpoint: endpoints[index], error: 'Health check failed' }
      );
  }
}

// Export singleton instance
export const smartFetch = new SmartFetch();

// Export the main function for convenience
export const fetch = smartFetch.smartFetch.bind(smartFetch);