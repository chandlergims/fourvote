'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import AboutModal from './AboutModal';

const Navbar: React.FC = () => {
  const { isAuthenticated, walletAddress, isLoading, connectWallet, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const pathname = usePathname();

  // Format wallet address for display
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="bg-gray-900 text-white">
      {/* Top Navbar with Wallet Connection */}
      <div className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center text-xl font-bold text-[rgb(134,239,172)]">
              PumpTrap
            </Link>
            <button 
              onClick={() => setAboutModalOpen(true)} 
              className="text-md font-bold hover:text-[rgb(134,239,172)]"
            >
              about
            </button>
            <a 
              href="https://x.com/pumptrapdotfun" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-md font-bold hover:text-[rgb(134,239,172)]"
            >
              twitter
            </a>
          </div>

          <div className="flex items-center space-x-4 relative">
            {isAuthenticated ? (
              <>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-2 overflow-hidden rounded-md border border-[rgb(134,239,172)] text-[rgb(134,239,172)] h-8 text-sm px-2"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
                    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
                  </svg>
                  <span className="truncate max-w-[120px]" title={walletAddress || ''}>
                    {formatWalletAddress(walletAddress || '')}
                  </span>
                </button>
                
                {dropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 min-w-48 rounded-lg overflow-hidden border border-[#2a2a2a] bg-[#1b1d28] p-1 text-white shadow-md z-50"
                    style={{ fontFamily: 'var(--font-geist-mono)', top: '100%' }}
                  >
                    <div className="p-2">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[rgb(134,239,172)]">
                          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
                          <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
                        </svg>
                        <span className="text-sm">{formatWalletAddress(walletAddress || '')}</span>
                      </div>
                    </div>
                    <div className="-mx-1 my-1 h-px bg-[#2a2a2a]"></div>
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 text-sm w-full text-left"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" x2="9" y1="12" y2="12"></line>
                        </svg>
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="flex items-center overflow-hidden rounded-md p-2 border border-[rgb(134,239,172)] text-[rgb(134,239,172)] hover:bg-[rgb(134,239,172)]/10 h-8 text-sm w-full justify-center gap-2"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" x2="3" y1="12" y2="12"></line>
                </svg>
                <span className="font-bold">
                  {isLoading ? 'connecting...' : 'connect wallet'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Simple Navigation Bar */}
      <nav id="navigation" className="flex bg-[#1b1d28] text-white">
        <div className="nav-button-container w-1/2">
          <Link 
            href="/" 
            className={`flex justify-center items-center gap-1 w-full h-full py-3 font-bold ${
              pathname === '/' ? 'bg-[#151722]' : 'hover:bg-[#151722]'
            }`}
          >
            <span className="text-xl">🎭</span>
            TRAP CARDS
            <span className="text-xl">🎭</span>
          </Link>
        </div>
        <div className="nav-button-container w-1/2">
          <Link 
            href="/create" 
            className={`flex justify-center items-center gap-1 w-full h-full py-3 font-bold ${
              pathname === '/create' ? 'bg-[#151722]' : 'hover:bg-[#151722]'
            }`}
          >
            <span className="text-xl">✨</span>
            CREATE
            <span className="text-xl">✨</span>
          </Link>
        </div>
      </nav>

      {/* About Modal */}
      <AboutModal isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />
    </div>
  );
};

export default Navbar;
