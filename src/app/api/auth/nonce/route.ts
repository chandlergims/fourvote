import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { generateNonce } from '../../../../lib/metamask';

export async function GET(req: NextRequest) {
  try {
    // Get wallet address from query params
    const searchParams = req.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Generate a new nonce
    const nonce = generateNonce();

    // Check if user exists
    const existingUser = await User.findOne({ walletAddress });
    
    if (existingUser) {
      // Update existing user's nonce
      existingUser.nonce = nonce;
      await existingUser.save();
      console.log(`Updated nonce for existing user: ${walletAddress}`);
    } else {
      // Create new user
      const newUser = new User({
        walletAddress,
        nonce,
        isProfileComplete: false,
        lastLogin: new Date(),
      });
      await newUser.save();
      console.log(`Created new user: ${walletAddress}`);
    }

    return NextResponse.json({ nonce });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}
