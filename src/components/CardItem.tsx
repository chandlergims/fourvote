'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { voteForCard } from '../lib/api';
import BNBvoteCard from './BNBvoteCard';

interface CardItemProps {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  creator: string;
  votes: number;
  voters: string[];
  isTokenized: boolean;
  onVote?: (cardId: string) => void;
}

const CardItem: React.FC<CardItemProps> = ({
  id,
  title,
  description,
  imageUrl,
  creator,
  votes,
  voters,
  isTokenized,
  onVote,
}) => {
  const { address, isAuthenticated } = useAuth();
  const [isVoting, setIsVoting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasVoted = voters.includes(address || '');
  const isCreator = creator === address;
  const canVote = isAuthenticated && !hasVoted && !isCreator;

  // Extract ticker from description if available
  const tickerMatch = description.match(/Ticker: ([A-Z0-9]+)/);
  const ticker = tickerMatch ? tickerMatch[1] : '';

  // Extract dev fee percentage if available (for demo purposes)
  const devFeePercentage = '5'; // This would come from attributes in a real implementation

  const formatWalletAddress = (address: string) => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  const handleVote = async () => {
    if (!canVote) return;

    setIsVoting(true);
    setError(null);

    try {
      await voteForCard(id);
      if (onVote) {
        onVote(id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to vote for card');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-xl transition-transform hover:scale-105 bg-gray-800">
      {/* Card Preview */}
      <div className="relative">
        <BNBvoteCard
          title={title}
          imageUrl={imageUrl || null}
          ticker={ticker}
          description={description}
          devFeePercentage={devFeePercentage}
        />
        
        {/* Vote Count Badge */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs flex items-center">
          <span className="mr-1">🔥</span>
          {votes}
        </div>
        
        {isTokenized && (
          <div className="absolute top-2 right-2 bg-yellow-900 text-yellow-200 text-xs px-2 py-1 rounded-full">
            Tokenized
          </div>
        )}
      </div>

      {/* Card Info and Vote Button */}
      <div className="p-3">
        <div className="flex justify-between items-center text-sm mb-3">
          <span className="text-gray-400 text-xs">By: {formatWalletAddress(creator)}</span>
          {error && (
            <p className="text-red-500 text-xs">{error}</p>
          )}
        </div>

        <button
          onClick={handleVote}
          disabled={!canVote || isVoting}
          className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            canVote
              ? 'bg-[rgb(134,239,172)] hover:bg-[rgb(110,220,150)] text-black'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isVoting
            ? 'Voting...'
            : hasVoted
            ? 'Already Voted'
            : isCreator
            ? 'Your Card'
            : 'Vote'}
        </button>
      </div>
    </div>
  );
};

export default CardItem;
