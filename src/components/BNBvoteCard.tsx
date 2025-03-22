'use client';

import React from "react";

interface BNBvoteCardProps {
  title: string;
  imageUrl: string | null;
  ticker: string;
  description: string;
  devFeePercentage: string;
  smallPreview?: boolean;
}

const BNBvoteCard: React.FC<BNBvoteCardProps> = ({ 
  title, 
  imageUrl, 
  ticker, 
  description, 
  devFeePercentage,
  smallPreview = false
}) => {
  if (smallPreview) {
    return (
      <div className="relative w-full h-full rounded-md overflow-hidden">
        {/* Just the image for small preview */}
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <p className="text-gray-400 text-[8px]">Upload meme</p>
          </div>
        )}
        
        {/* Minimal ticker overlay with no black background */}
        <div className="absolute top-1 right-1 text-[rgb(134,239,172)] text-[6px] font-bold px-1 rounded-sm">
          {ticker || "TICKER"}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-md overflow-hidden">
      {/* Just the image */}
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover" 
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Upload your meme</p>
        </div>
      )}
      
      {/* Just the ticker in the corner with no black background */}
      <div className="absolute top-2 right-2 text-[rgb(134,239,172)] text-xs px-1.5 py-0.5 rounded font-bold">
        {ticker || "TICKER"}
      </div>
    </div>
  );
};

export default BNBvoteCard;
