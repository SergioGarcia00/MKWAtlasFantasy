'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { USER_IDS } from '@/data/users';
import type { User } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

async function getAllUsers(): Promise<User[]> {
    const users: User[] = [];
    for (const id of USER_IDS) {
        const filePath = path.join(USERS_DIR, `${id}.json`);
        const userContent = await fs.readFile(filePath, 'utf-8');
        users.push(JSON.parse(userContent));
    }
    return users;
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
    
    const allUsers = await getAllUsers();
    
    let highestBid = 0;
    for (const user of allUsers) {
        if (user.bids && user.bids[playerId]) {
            highestBid = Math.max(highestBid, user.bids[playerId]);
        }
    }

    if (bidAmount <= highestBid) {
        return NextResponse.json({ message: `Your bid must be higher than the current highest bid of ${highestBid.toLocaleString()}.` }, { status: 400 });
    }

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

    return NextResponse.json({ message: 'Bid placed successfully' });

  } catch (error) {
    console.error('Failed to place bid:', error);
    return NextResponse.json({ message: 'Error placing bid' }, { status: 500 });
  }
}
