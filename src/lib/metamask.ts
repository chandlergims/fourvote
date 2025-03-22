import { sign, verify } from 'jsonwebtoken';
import { ethers } from 'ethers';

// Secret key for JWT signing - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Generate a random nonce for wallet signature
 */
export function generateNonce(): string {
  return Math.floor(Math.random() * 1000000).toString();
}

/**
 * Get the message that will be signed by the wallet
 */
export function getSignMessage(nonce: string): string {
  return `Sign this message to authenticate with BNBvote: ${nonce}`;
}

/**
 * Verify a signature from an Ethereum wallet
 */
export async function verifySignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    // Check if the recovered address matches the provided address
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Authenticate a wallet and generate a JWT token
 */
export async function authenticateWallet(
  walletAddress: string,
  signature: string,
  message: string
): Promise<{ token: string; walletAddress: string }> {
  // Verify the signature
  const isValid = await verifySignature(walletAddress, signature, message);

  if (!isValid) {
    throw new Error('Invalid signature');
  }

  // Generate a JWT token
  const token = sign(
    {
      walletAddress,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 1 week
    },
    JWT_SECRET
  );

  return {
    token,
    walletAddress,
  };
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): { walletAddress: string } | null {
  try {
    const decoded = verify(token, JWT_SECRET);
    return decoded as { walletAddress: string };
  } catch (error) {
    return null;
  }
}
