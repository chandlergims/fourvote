/**
 * Utility functions for making API requests
 */

// Base URL for API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Default timeout for requests (10 seconds)
const DEFAULT_TIMEOUT = 10000;

// Maximum number of retries
const MAX_RETRIES = 3;

// Retry backoff factor (milliseconds)
const RETRY_BACKOFF = 1000;

/**
 * Create a promise that rejects after a timeout
 */
function timeoutPromise(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), ms);
  });
}

/**
 * Make an authenticated API request with timeout and retry logic
 */
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit & { timeout?: number; retries?: number } = {}
) {
  const { timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES, ...fetchOptions } = options;
  let lastError: Error | null = null;
  
  // Try the request with retries
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Get the JWT token from localStorage
      const token = localStorage.getItem('token');

      // Set up headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(fetchOptions.headers as Record<string, string> || {}),
      };

      // Add cache control headers for GET requests to prevent browser caching
      if (!fetchOptions.method || fetchOptions.method === 'GET') {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
      }

      // Create the fetch promise
      const fetchPromise = fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
      });

      // Race the fetch against a timeout
      const response = await Promise.race([
        fetchPromise,
        timeoutPromise(timeout)
      ]) as Response;

      // Try to parse the JSON response
      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (e) {
        // If JSON parsing fails, it might be HTML or another format
        console.error('Failed to parse response as JSON:', text.substring(0, 100) + '...');
        throw new Error('Invalid response format. Expected JSON.');
      }

      // If the response is not ok, throw an error
      if (!response.ok) {
        const error = new Error(data.error || data.message || 'Something went wrong');
        // Add status code to the error for better handling
        (error as any).statusCode = response.status;
        throw error;
      }

      return data;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if it's a client error (4xx)
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        break;
      }
      
      // Don't retry on the last attempt
      if (attempt === retries) {
        break;
      }
      
      // Exponential backoff
      const backoffTime = RETRY_BACKOFF * Math.pow(2, attempt);
      console.warn(`Request failed, retrying in ${backoffTime}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  
  // If we got here, all retries failed
  console.error('All request attempts failed:', lastError);
  throw lastError || new Error('Request failed after multiple retries');
}

/**
 * Get cards with pagination and sorting
 */
export async function getCards(options: {
  limit?: number;
  page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  signal?: AbortSignal;
} = {}) {
  const { limit = 10, page = 1, sort = 'votes', order = 'desc', signal } = options;
  
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString(),
    sort,
    order,
    // Add cache busting parameter
    _t: Date.now().toString(),
  });

  return fetchWithAuth(`/api/cards?${queryParams.toString()}`, {
    // Pass the abort signal if provided
    signal,
    // Increase timeout for this specific request
    timeout: 15000,
  });
}

/**
 * Create a new card
 */
export async function createCard(cardData: {
  title: string;
  description: string;
  imageUrl?: string;
  attributes?: Record<string, string | number | boolean>;
}) {
  return fetchWithAuth('/api/cards/create', {
    method: 'POST',
    body: JSON.stringify(cardData),
  });
}

/**
 * Vote for a card
 */
export async function voteForCard(cardId: string) {
  return fetchWithAuth('/api/cards/vote', {
    method: 'POST',
    body: JSON.stringify({ cardId }),
    // Reduce retries for voting to prevent duplicate votes
    retries: 1,
  });
}
