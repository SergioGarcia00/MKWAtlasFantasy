'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { USER_IDS } from '@/data/users';
import type { User } from '@/lib/types';
import { ALL_PLAYERS } from '@/data/players';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

async function getUser(userId: string): Promise<User | null> {
    const filePath = path.join(USERS_DIR, `${userId}.json`);
    try {
        const userContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(userContent);
    } catch (error) {
        return null;
    }
}

export async function POST(
  request: Request,
  { params }: { params: { playerId: string } }
) {
  try {
    const { playerId } = params;
    const { userId, bidAmount } = await request.json();

    if (!userId || !bidAmount) {
      return NextResponse.json({ message: 'User ID and bid amount are required' }, { status: 400 });
    }
    
    const playerToBidOn = ALL_PLAYERS.find(p => p.id === playerId);
    if (!playerToBidOn) {
      return NextResponse.json({ message: 'Player not found' }, { status: 404 });
    }

    if (bidAmount < playerToBidOn.cost) {
      return NextResponse.json({ message: `Your bid must be at least the base cost of ${playerToBidOn.cost.toLocaleString()}.` }, { status: 400 });
    }

    // --- Read-Modify-Write Start ---
    const bidderFilePath = path.join(USERS_DIR, `${userId}.json`);
    let bidder: User;
    try {
        const bidderContent = await fs.readFile(bidderFilePath, 'utf-8');
        bidder = JSON.parse(bidderContent);
    } catch (error) {
         return NextResponse.json({ message: 'Bidder not found' }, { status: 404 });
    }

    if(bidder.players.some(p => p.id === playerId)) {
        return NextResponse.json({ message: "You can't bid on a player you already own." }, { status: 400 });
    }

    const otherBidsAmount = Object.entries(bidder.bids || {})
      .filter(([pId]) => pId !== playerId)
      .reduce((sum, [, amount]) => sum + amount, 0);

    if (bidder.currency < (otherBidsAmount + bidAmount)) {
        return NextResponse.json({ message: 'Insufficient funds for this bid considering your other active bids.' }, { status: 400 });
    }
    
    bidder.bids = { ...bidder.bids, [playerId]: bidAmount };

    await fs.writeFile(bidderFilePath, JSON.stringify(bidder, null, 2), 'utf-8');
    // --- Read-Modify-Write End ---


    return NextResponse.json({ message: 'Bid placed successfully' });

  } catch (error) {
    console.error('Failed to place bid:', error);
    return NextResponse.json({ message: 'Error placing bid' }, { status: 500 });
  }
}
