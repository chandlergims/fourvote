'use client';

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface AuthContextType {
  isAuthenticated: boolean;
  address: string | null;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  address: null,
  isLoading: false,
  connectWallet: async () => {},
  logout: () => {},
  error: null,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user was previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            const userAddress = accounts[0].address;
            setAddress(userAddress);
            
            // Check if we have a token stored
            const token = localStorage.getItem('token');
            if (token) {
              setIsAuthenticated(true);
            } else {
              // Register or login the user
              await registerOrLoginUser(userAddress);
            }
          }
        } catch (err) {
          console.error('Failed to check connection:', err);
        }
      }
    };
    
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          logout();
        } else {
          // Account changed
          const newAddress = accounts[0];
          setAddress(newAddress);
          
          // Register or login with new address
          await registerOrLoginUser(newAddress);
        }
      };

      const ethereum = window.ethereum;
      if (ethereum) {
        ethereum.on('accountsChanged', handleAccountsChanged);

        return () => {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
        };
      }
    }
  }, []);

  const registerOrLoginUser = async (walletAddress: string) => {
    try {
      // Get nonce from server
      const nonceResponse = await fetch(`/api/auth/nonce?walletAddress=${walletAddress}`);
      const nonceData = await nonceResponse.json();
      
      if (!nonceResponse.ok) {
        throw new Error(nonceData.error || 'Failed to get nonce');
      }
      
      // Create message to sign
      const message = `Sign this message to authenticate with BNBvote: ${nonceData.nonce}`;
      
      // Request signature from wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      
      // Authenticate with server
      const loginResponse = await fetch('/api/auth/metamask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
        }),
      });
      
      const loginData = await loginResponse.json();
      
      if (!loginResponse.ok) {
        throw new Error(loginData.error || 'Failed to authenticate');
      }
      
      // Store token and wallet address
      localStorage.setItem('token', loginData.token);
      localStorage.setItem('walletAddress', walletAddress);
      
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Error registering/logging in user:', err);
      setError(err.message || 'Failed to register/login user');
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask is not installed');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        const userAddress = accounts[0];
        setAddress(userAddress);
        
        // Register the user or check if they exist
        await registerOrLoginUser(userAddress);
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('walletAddress');
    setIsAuthenticated(false);
    setAddress(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        address,
        isLoading,
        connectWallet,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
