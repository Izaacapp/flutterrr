export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class NetworkError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export async function fetchWithTimeout(
  url: string,
  { timeout = 5000, retries = 3, retryDelay = 1000, ...options }: FetchWithTimeoutOptions = {}
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`🌐 FETCH: Attempt ${attempt}/${retries} to ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new NetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          'HTTP_ERROR'
        );
      }

      console.log(`✅ FETCH: Success on attempt ${attempt}`);
      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error as Error;

      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new NetworkError('Request timeout', undefined, 'TIMEOUT');
      }

      console.error(`❌ FETCH: Attempt ${attempt} failed:`, lastError.message);

      // Don't retry on 4xx errors (client errors)
      if (error instanceof NetworkError && error.status && error.status >= 400 && error.status < 500) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ FETCH: Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`💀 FETCH: All ${retries} attempts failed for ${url}`);
  throw lastError || new NetworkError('Network request failed', undefined, 'UNKNOWN');
}