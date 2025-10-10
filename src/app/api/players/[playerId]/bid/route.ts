'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { User, Player } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

async function getAllUsers(): Promise<User[]> {
    const userFiles = await fs.readdir(USERS_DIR);
    const users: User[] = [];
    for (const file of userFiles) {
        if (file.endsWith('.json')) {
            const filePath = path.join(USERS_DIR, file);
            const userContent = await fs.readFile(filePath, 'utf-8');
            users.push(JSON.parse(userContent));
        }
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
    
    // Find the current highest bid for the player across all users
    let highestBid = 0;
    for (const user of allUsers) {
        if (user.bids && user.bids[playerId]) {
            highestBid = Math.max(highestBid, user.bids[playerId]);
        }
    }

    if (bidAmount <= highestBid) {
        return NextResponse.json({ message: `Your bid must be higher than the current highest bid of ${highestBid.toLocaleString()}.` }, { status: 400 });
    }

    const bidder = allUsers.find(u => u.id === userId);
    
    if (!bidder) {
      return NextResponse.json({ message: 'Bidder not found' }, { status: 404 });
    }

    if(bidder.players.some(p => p.id === playerId)) {
        return NextResponse.json({ message: "You can't bid on a player you already own." }, { status: 400 });
    }

    // Calculate total amount of *other* bids by the user
    const otherBidsAmount = Object.entries(bidder.bids || {})
      .filter(([pId]) => pId !== playerId)
      .reduce((sum, [, amount]) => sum + amount, 0);

    if (bidder.currency < (otherBidsAmount + bidAmount)) {
        return NextResponse.json({ message: 'Insufficient funds for this bid considering your other active bids.' }, { status: 400 });
    }
    
    const updatedUser = {
        ...bidder,
        bids: {
            ...bidder.bids,
            [playerId]: bidAmount,
        }
    };
    
    const userFilePath = path.join(USERS_DIR, `${userId}.json`);
    await fs.writeFile(userFilePath, JSON.stringify(updatedUser, null, 2), 'utf-8');


    return NextResponse.json({ message: 'Bid placed successfully' });

  } catch (error) {
    console.error('Failed to place bid:', error);
    return NextResponse.json({ message: 'Error placing bid' }, { status: 500 });
  }
}
