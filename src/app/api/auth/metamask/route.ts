import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { authenticateWallet, getSignMessage } from '../../../../lib/metamask';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { walletAddress, signature } = body;

    if (!walletAddress || !signature) {
      return NextResponse.json(
        { error: 'Wallet address and signature are required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Find the user by wallet address
    const user = await User.findOne({ walletAddress });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please request a nonce first.' },
        { status: 404 }
      );
    }

    // Get the message that was signed
    const message = getSignMessage(user.nonce);

    // Authenticate the wallet
    const authResponse = await authenticateWallet(
      walletAddress,
      signature,
      message
    );

    // Update user's lastLogin and generate a new nonce for next time
    user.lastLogin = new Date();
    user.nonce = Math.floor(Math.random() * 1000000).toString();
    await user.save();

    console.log(`User ${walletAddress} logged in successfully`);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Error authenticating wallet:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate wallet' },
      { status: 500 }
    );
  }
}
