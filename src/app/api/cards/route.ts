import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Card from '../../../models/Card';

// Simple in-memory cache
interface CacheItem {
  data: any;
  expiry: number;
}

const CACHE_TTL = 60 * 1000; // 1 minute cache TTL
const cache: Record<string, CacheItem> = {};

// Function to get cache key from request
function getCacheKey(req: NextRequest): string {
  const url = new URL(req.url);
  return `${url.pathname}${url.search}`;
}

// Function to check if cache is valid
function getCachedResponse(key: string): any | null {
  const item = cache[key];
  const now = Date.now();
  
  if (item && item.expiry > now) {
    return item.data;
  }
  
  // Clean up expired cache
  if (item) {
    delete cache[key];
  }
  
  return null;
}

// Function to set cache
function setCachedResponse(key: string, data: any): void {
  cache[key] = {
    data,
    expiry: Date.now() + CACHE_TTL
  };
  
  // Clean up cache if it gets too large (prevent memory leaks)
  const MAX_CACHE_SIZE = 100;
  const cacheKeys = Object.keys(cache);
  if (cacheKeys.length > MAX_CACHE_SIZE) {
    // Remove oldest entries
    const oldestKeys = cacheKeys
      .map(k => ({ key: k, expiry: cache[k].expiry }))
      .sort((a, b) => a.expiry - b.expiry)
      .slice(0, cacheKeys.length - MAX_CACHE_SIZE)
      .map(item => item.key);
    
    oldestKeys.forEach(k => delete cache[k]);
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check cache first
    const cacheKey = getCacheKey(req);
    const cachedData = getCachedResponse(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData);
    }
    
    // Connect to the database
    await dbConnect();

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const sort = searchParams.get('sort') || 'votes'; // Default sort by votes
    const order = searchParams.get('order') || 'desc'; // Default order descending

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sortObj: { [key: string]: 1 | -1 } = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Set a timeout for the database query
    const QUERY_TIMEOUT = 5000; // 5 seconds
    
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timed out')), QUERY_TIMEOUT);
    });
    
    // Create the database query promise
    const queryPromise = Promise.all([
      Card.find()
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean() for better performance
      
      Card.countDocuments()
    ]);
    
    // Race the query against the timeout
    const [cards, total] = await Promise.race([queryPromise, timeoutPromise]) as [any[], number];

    const responseData = {
      cards,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
    
    // Cache the response
    setCachedResponse(cacheKey, responseData);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error fetching cards:', error);
    
    // Return a more specific error message
    const errorMessage = error.message || 'Failed to fetch cards';
    const statusCode = error.message === 'Database query timed out' ? 503 : 500;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        message: 'We are experiencing high traffic. Please try again in a moment.'
      },
      { status: statusCode }
    );
  }
}
