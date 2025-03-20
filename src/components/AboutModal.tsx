'use client';

import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent"
      onClick={onClose}
    >
      <div 
        className="bg-[#1b1d28] border-2 border-[rgb(134,239,172)] rounded-lg w-full max-w-xl max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-[#2a2a2a]">
          <h2 className="text-2xl font-bold text-[rgb(134,239,172)]">About PumpTrap</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-4 text-white">
            <p className="text-lg">
              Welcome to PumpTrap - the platform for creating, voting on, and tokenizing trap cards!
            </p>
            
            <h3 className="text-xl font-bold text-[rgb(134,239,172)] mt-6">How It Works</h3>
            <p>
              1. <span className="font-bold">Create</span>: Design your own unique trap card with a custom image, name, ticker, and bio.
            </p>
            <p>
              2. <span className="font-bold">Vote</span>: Community members vote for their favorite trap cards.
            </p>
            <p>
              3. <span className="font-bold">Tokenize</span>: The most popular trap cards get tokenized on the blockchain.
            </p>
            
            <h3 className="text-xl font-bold text-[rgb(134,239,172)] mt-6">Fair Launch</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>0% insider or dev allocation</li>
              <li>Dev earns a percentage of every buy/sell based on the dev fee</li>
              <li>Transparent tokenomics make it impossible to rug</li>
            </ul>
          </div>
        </div>
        
        <div className="p-4 border-t border-[#2a2a2a] flex justify-end">
          <button 
            onClick={onClose}
            className="bg-[rgb(134,239,172)] hover:bg-[rgb(110,220,150)] text-black px-4 py-2 rounded-md font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
