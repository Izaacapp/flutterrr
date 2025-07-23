// Request deduplication utility to prevent duplicate API calls
type PendingRequest = {
  promise: Promise<any>;
  timestamp: number;
};

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly CACHE_DURATION = 1000; // 1 second cache

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if we have a pending request for this key
    const pending = this.pendingRequests.get(key);
    
    if (pending) {
      const age = Date.now() - pending.timestamp;
      // If the request is still fresh, return the existing promise
      if (age < this.CACHE_DURATION) {
        return pending.promise as Promise<T>;
      }
      // Otherwise, clean up the stale request
      this.pendingRequests.delete(key);
    }

    // Create new request
    const promise = requestFn()
      .finally(() => {
        // Clean up after request completes
        setTimeout(() => {
          this.pendingRequests.delete(key);
        }, this.CACHE_DURATION);
      });

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  // Clear all pending requests
  clear() {
    this.pendingRequests.clear();
  }

  // Clear a specific request
  clearKey(key: string) {
    this.pendingRequests.delete(key);
  }
}

export const requestDeduplicator = new RequestDeduplicator();