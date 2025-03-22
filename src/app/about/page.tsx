'use client';

import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">About FourVote</h1>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[rgb(134,239,172)] mb-4">What is FourVote?</h2>
            <p className="text-lg mb-4">
              FourVote is a community-driven fair launch platform where users can create and vote on meme cards. The most popular meme, as determined by community votes, will be tokenized when the timer expires.
            </p>
            
            <p className="text-lg mb-4">
              Our platform ensures that only the strongest and highest quality memes get tokenized. This competitive voting system creates a natural selection process where the best memes rise to the top, resulting in higher quality token launches and stronger communities.
            </p>
            
            <h2 className="text-2xl font-bold text-[rgb(134,239,172)] mt-8 mb-4">How it works</h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-2">1. Create a Meme Card</h3>
                <p>Upload your favorite meme, give it a name, ticker symbol, and description. Set your desired creator fee percentage that you'll receive from future trades.</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-2">2. Community Voting</h3>
                <p>The community votes on their favorite meme cards. Each wallet can vote for multiple cards, but only once per card.</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-2">3. Tokenization</h3>
                <p>When the timer expires, the meme card with the most votes is automatically tokenized as a 100% fair launch token on the BNB Chain.</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-2">4. Rewards Distribution</h3>
                <p>The creator of the winning card receives fees from trades based on the tokenomics they set. Voters who supported the winning card also receive rewards from the token's ecosystem.</p>
              </div>
            </div>
            
            <p className="text-lg mt-8">
              Join FourVote today to participate in the future of community-driven meme tokenization!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
