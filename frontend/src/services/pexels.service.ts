interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

class PexelsService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_PEXELS_API_KEY || 'GAbObNkJoksVvDYm1iJiBaYeDMEHyCsXb5u70nYZ5J87Zv8HXrGqfh1x';
    this.baseUrl = 'https://api.pexels.com/v1';
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    return response.json();
  }

  async searchLocationPhotos(location: string, perPage: number = 20): Promise<PexelsResponse> {
    const enhancedQuery = `${location} travel destination landscape`;
    const encodedQuery = encodeURIComponent(enhancedQuery);
    
    return this.makeRequest<PexelsResponse>(`/search?query=${encodedQuery}&per_page=${perPage}&orientation=landscape`);
  }

  // Cache results to avoid hitting rate limits
  private cacheKey(location: string): string {
    return `pexels-${location.toLowerCase().replace(/\s+/g, '-')}`;
  }

  async searchWithCache(location: string, perPage: number = 20): Promise<PexelsResponse> {
    const cacheKey = this.cacheKey(location);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const cachedData = JSON.parse(cached);
      // Cache for 1 hour
      if (Date.now() - cachedData.timestamp < 3600000) {
        return cachedData.data;
      }
    }

    const data = await this.searchLocationPhotos(location, perPage);
    
    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));

    return data;
  }
}

export const pexelsService = new PexelsService();
export type { PexelsPhoto, PexelsResponse };