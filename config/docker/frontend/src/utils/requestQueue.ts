interface QueuedRequest {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retries: number;
}

export class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private concurrentRequests = 0;
  private readonly MAX_CONCURRENT = 5;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private requestCounts = new Map<string, number>();
  private readonly RATE_LIMIT_WINDOW = 1000; // 1 second
  private readonly MAX_REQUESTS_PER_WINDOW = 10;

  async add<T>(execute: () => Promise<T>, key?: string): Promise<T> {
    // Rate limiting
    if (key) {
      const now = Date.now();
      const windowStart = Math.floor(now / this.RATE_LIMIT_WINDOW) * this.RATE_LIMIT_WINDOW;
      const countKey = `${key}-${windowStart}`;
      const count = this.requestCounts.get(countKey) || 0;
      
      if (count >= this.MAX_REQUESTS_PER_WINDOW) {
        throw new Error('Rate limit exceeded');
      }
      
      this.requestCounts.set(countKey, count + 1);
      
      // Clean up old entries
      for (const [k] of this.requestCounts) {
        const [, timestamp] = k.split('-');
        if (parseInt(timestamp) < windowStart - this.RATE_LIMIT_WINDOW * 2) {
          this.requestCounts.delete(k);
        }
      }
    }

    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: Math.random().toString(36).substr(2, 9),
        execute,
        resolve,
        reject,
        retries: 0
      };

      this.queue.push(request);
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.concurrentRequests >= this.MAX_CONCURRENT) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.concurrentRequests < this.MAX_CONCURRENT) {
      const request = this.queue.shift();
      if (!request) continue;

      this.concurrentRequests++;
      this.executeRequest(request);
    }

    this.processing = false;
  }

  private async executeRequest(request: QueuedRequest) {
    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error: any) {
      if (request.retries < this.MAX_RETRIES && this.shouldRetry(error)) {
        request.retries++;
        const delay = this.RETRY_DELAY * Math.pow(2, request.retries - 1);
        
        setTimeout(() => {
          this.queue.unshift(request);
          this.process();
        }, delay);
      } else {
        request.reject(error);
      }
    } finally {
      this.concurrentRequests--;
      this.process();
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx server errors
    if (error.message === 'Failed to fetch') return true;
    if (error.response?.status >= 500) return true;
    if (error.code === 'ECONNRESET') return true;
    return false;
  }

  clear() {
    this.queue = [];
    this.requestCounts.clear();
  }
}

export const requestQueue = new RequestQueue();