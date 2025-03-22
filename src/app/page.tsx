'use client';

import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { getCards, voteForCard } from "../lib/api";
import BNBvoteCard from "../components/BNBvoteCard";

// Define card type for better type safety
interface Card {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  creator: string;
  votes: number;
  voters: string[];
  createdAt: string;
  attributes?: {
    ticker?: string;
    devFeePercentage?: string;
  };
  ticker?: string;
  devFeePercentage?: string;
  hasVoted?: boolean;
}

// Client component to handle search params
import { useSearchParams } from "next/navigation";

function AuthRequiredCheck() {
  const searchParams = useSearchParams();
  return searchParams.get('authRequired') === 'true';
}

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, address } = useAuth();
  const [authRequired, setAuthRequired] = useState(false);
  
  // Check URL params on client side and handle refresh
  useEffect(() => {
    const url = new URL(window.location.href);
    const authRequiredParam = url.searchParams.get('authRequired');
    const refreshParam = url.searchParams.get('refresh');
    const tabParam = url.searchParams.get('tab');
    
    setAuthRequired(authRequiredParam === 'true');
    
    // Set active tab if specified in URL
    if (tabParam && ['votes', 'creation', 'my'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    // If redirected from create page with refresh param, reload cards
    if (refreshParam === 'true') {
      fetchCards(true);
      
      // Remove the refresh and tab parameters from URL without page reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      newUrl.searchParams.delete('tab');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);
  
  const [activeTab, setActiveTab] = useState('votes');
  const [searchQuery, setSearchQuery] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [voteLoading, setVoteLoading] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Auto-retry interval (in milliseconds)
  const AUTO_RETRY_INTERVAL = 10000; // 10 seconds
  const MAX_AUTO_RETRIES = 3;

  // Format wallet address for display
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Calculate time remaining until 12:30 AM EST
  const calculateTimeRemaining = useCallback(() => {
    const now = new Date();
    const targetTime = new Date();
    
    // Set target time to 12:30 AM EST
    targetTime.setHours(0, 30, 0, 0);
    
    // If it's already past 12:30 AM, set target to next day
    if (now > targetTime) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    // Calculate difference in milliseconds
    const diff = targetTime.getTime() - now.getTime();
    
    // Convert to hours, minutes, seconds
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Format as HH:MM:SS
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);
    
    // Initialize timer immediately
    setTimeRemaining(calculateTimeRemaining());
    
    return () => clearInterval(timer);
  }, [calculateTimeRemaining]);

  // Set up auto-retry for failed requests
  useEffect(() => {
    let retryTimer: NodeJS.Timeout | null = null;
    
    if (apiError && retryCount < MAX_AUTO_RETRIES) {
      retryTimer = setTimeout(() => {
        console.log(`Auto-retrying fetch (attempt ${retryCount + 1}/${MAX_AUTO_RETRIES})...`);
        setRetryCount(prev => prev + 1);
        fetchCards(true);
      }, AUTO_RETRY_INTERVAL);
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [apiError, retryCount]);

  // Fetch cards from the API regardless of authentication status
  useEffect(() => {
    // Reset pagination when tab changes
    setCurrentPage(1);
    setHasMorePages(true);
    setCards([]);
    
    // Call fetchCards without a controller
    fetchCards(true);
    
    // Cleanup function to abort any in-flight requests when tab changes
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {
          console.error('Error aborting controller:', e);
        }
        abortControllerRef.current = null;
      }
    };
  }, [activeTab]);

  const fetchCards = async (reset = false) => {
    // Cancel any previous requests
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {
        console.error('Error aborting previous controller:', e);
      }
    }
    
    // Create a new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      
      setApiError(null);
      
      // Determine sort parameter based on active tab
      const sortParam = activeTab === 'votes' ? 'votes' : 'createdAt';
      
      // Use smaller page size for better performance
      const pageSize = 10;
      const pageToFetch = reset ? 1 : currentPage;
      
      // Create query parameters
      const queryParams: any = {
        sort: sortParam,
        order: 'desc',
        limit: pageSize,
        page: pageToFetch,
        signal: controller.signal
      };
      
      // If on "My Cards" tab and user is authenticated, filter by creator
      if (activeTab === 'my' && isAuthenticated && address) {
        queryParams.creator = address;
      }
      
      const response = await getCards(queryParams);
      
      // Update pagination state
      setCurrentPage(pageToFetch + 1);
      setHasMorePages(response.pagination.page < response.pagination.pages);
      
      // Process the cards
      const newCards = response.cards.map((card: Card) => ({
        ...card,
        hasVoted: address ? card.voters?.includes(address) : false,
        ticker: card.attributes?.ticker || card.ticker || 'TRAP',
        devFeePercentage: card.attributes?.devFeePercentage || card.devFeePercentage || '10'
      }));
      
      // Update cards state (append or replace)
      setCards(prevCards => reset ? newCards : [...prevCards, ...newCards]);
      setRetryCount(0); // Reset retry count on success
      setInitialLoad(false);
    } catch (err: any) {
      // Don't set error if it was an abort error (user navigated away)
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      console.error('Error fetching cards:', err);
      setApiError(err.message || 'Failed to load cards');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Handle voting for a card
  const handleVote = async (cardId: string) => {
    if (!isAuthenticated) return;
    
    try {
      setVoteLoading(cardId);
      
      // Optimistically update UI
      setCards(prevCards => 
        prevCards.map(card => 
          card._id === cardId 
            ? { 
                ...card, 
                votes: card.votes + 1,
                voters: [...(card.voters || []), ...(address ? [address] : [])],
                hasVoted: true
              } 
            : card
        )
      );
      
      // Make the actual API call
      await voteForCard(cardId);
    } catch (err: any) {
      console.error('Error voting for card:', err);
      
      // Revert the optimistic update on error
      setCards(prevCards => 
        prevCards.map(card => 
          card._id === cardId && card.hasVoted
            ? { 
                ...card, 
                votes: card.votes - 1,
                voters: (card.voters || []).filter(voter => voter !== address),
                hasVoted: false
              } 
            : card
        )
      );
      
      // Show error message
      alert(err.message || 'Failed to vote for card');
    } finally {
      setVoteLoading(null);
    }
  };

  // Filter cards based on active tab and search query
  const filteredCards = cards.filter(card => {
    // Filter by search query
    if (searchQuery && !card.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by tab
    if (activeTab === 'my' && card.creator !== address) {
      return false;
    }
    
    return true;
  });
  
  // Sort cards based on active tab
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (activeTab === 'votes') {
      return b.votes - a.votes; // Sort by votes (most votes first)
    } else if (activeTab === 'creation') {
      // Convert dates to timestamps for comparison
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Sort by creation time (newest first)
    }
    return 0; // Default order
  });

  // Check if user has voted for each card
  const processedCards = sortedCards.map(card => ({
    ...card,
    hasVoted: address ? card.voters?.includes(address) : false,
    // Extract ticker from attributes if available
    ticker: card.attributes?.ticker || card.ticker || 'TRAP',
    // Extract devFeePercentage from attributes if available
    devFeePercentage: card.attributes?.devFeePercentage || card.devFeePercentage || '10'
  }));

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Authentication Required Message */}
        {!isAuthenticated && authRequired && (
          <div className="text-center mb-6">
            <div className="bg-red-900 border border-red-700 rounded-lg p-4 inline-block">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span className="text-white font-bold">Must be authenticated to access this feature</span>
              </div>
            </div>
          </div>
        )}

        {/* Voting Timer */}
        <div className="text-center mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 inline-block shadow-sm">
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2 text-[rgb(134,239,172)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-[rgb(134,239,172)] font-bold">Voting ends in:</span>
              <span className="ml-2 font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded-md">{timeRemaining}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-1 inline-flex shadow-sm">
            <button 
              className={`px-6 py-2 rounded-md font-bold ${activeTab === 'votes' ? 'bg-[rgb(134,239,172)] text-black' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => setActiveTab('votes')}
            >
              Most Votes
            </button>
            <button 
              className={`px-6 py-2 rounded-md font-bold ${activeTab === 'creation' ? 'bg-[rgb(134,239,172)] text-black' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => setActiveTab('creation')}
            >
              Creation Time
            </button>
            <button 
              className={`px-6 py-2 rounded-md font-bold ${activeTab === 'my' ? 'bg-[rgb(134,239,172)] text-black' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => setActiveTab('my')}
            >
              My FourVote Cards
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-8">
          <input
            type="text"
            placeholder="Search FourVote cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-md py-3 px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[rgb(134,239,172)] shadow-sm"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(134,239,172)] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading FourVote cards...</p>
          </div>
        )}

        {/* Error State */}
        {apiError && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold mb-2">Error Loading Cards</h3>
            <p className="text-red-400 mb-6">{apiError}</p>
            <button 
              onClick={() => fetchCards(true)}
              className="bg-[rgb(134,239,172)] hover:bg-[rgb(110,220,150)] text-black px-8 py-3 rounded-md font-bold text-lg inline-block"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Cards Grid or Empty State */}
        {!loading && !apiError && (
          processedCards.length > 0 ? (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {processedCards.map((card) => (
                  <div key={card._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="relative aspect-square">
                      <BNBvoteCard
                        title={card.title}
                        imageUrl={card.imageUrl}
                        ticker={card.ticker}
                        description=""
                        devFeePercentage={card.devFeePercentage}
                        smallPreview={false}
                      />
                      <div className="absolute top-2 left-2 bg-[rgb(134,239,172)] text-black px-2 py-1 rounded-full text-xs font-bold flex items-center">
                        <span className="mr-1">🔥</span>
                        {card.votes}
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <div className="mb-2">
                        <h3 className="text-sm font-bold text-gray-800 truncate">{card.title}</h3>
                        <p className="text-xs text-gray-500">By: {formatWalletAddress(card.creator || '')}</p>
                      </div>
                      
                      <button
                        onClick={() => !card.hasVoted && handleVote(card._id)}
                        className={`w-full py-1.5 rounded-md text-sm font-medium flex items-center justify-center ${
                          card.hasVoted 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-[rgb(134,239,172)] hover:bg-[rgb(110,220,150)] text-black'
                        }`}
                        disabled={card.hasVoted || voteLoading === card._id}
                      >
                        {voteLoading === card._id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Voting...
                          </>
                        ) : card.hasVoted ? (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            VOTED
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                            </svg>
                            Vote
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More Button */}
              {hasMorePages && !loadingMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => fetchCards(false)}
                    className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-8 py-3 rounded-md font-bold text-lg inline-flex items-center shadow-sm"
                  >
                    Load More Cards
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                </div>
              )}
              
              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="text-center mt-8">
                  <div className="inline-flex items-center">
                    <div className="animate-spin mr-3 h-5 w-5 border-t-2 border-b-2 border-[rgb(134,239,172)] rounded-full"></div>
                    <span className="text-gray-400">Loading more cards...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎭</div>
              <h3 className="text-2xl font-bold mb-2">No FourVote Cards Yet</h3>
              <p className="text-gray-400 mb-6">Be the first to create a FourVote card!</p>
              <Link 
                href="/create" 
                className="bg-[rgb(134,239,172)] hover:bg-[rgb(110,220,150)] text-black px-8 py-3 rounded-md font-bold text-lg inline-block"
              >
                Create a FourVote Card
              </Link>
            </div>
          )
        )}
      </div>
    </div>
  );
}
