'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { User } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

async function getUser(userId: string): Promise<User> {
    const filePath = path.join(USERS_DIR, `${userId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
}

async function saveUser(user: User): Promise<void> {
    const filePath = path.join(USERS_DIR, `${user.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(user, null, 2), 'utf-8');
}

export async function POST(request: Request, { params }: { params: { playerId: string } }) {
    try {
        const { playerId } = params;
        const { userId, amount } = await request.json();

        if (!userId || amount === undefined) {
            return NextResponse.json({ message: 'User ID and bid amount are required' }, { status: 400 });
        }

        const player = ALL_PLAYERS.find(p => p.id === playerId);
        if (!player) {
            return NextResponse.json({ message: 'Player not found in market' }, { status: 404 });
        }

        if (amount < player.cost) {
            return NextResponse.json({ message: `Bid must be at least the base cost of ${player.cost}.` }, { status: 400 });
        }

        const user = await getUser(userId);
        
        // Calculate total amount of other active bids
        const otherBidsAmount = Object.entries(user.bids || {})
          .filter(([pId]) => pId !== playerId)
          .reduce((sum, [, bidAmount]) => sum + (bidAmount as number), 0);
        
        const totalCommitted = otherBidsAmount + amount;

        if (user.currency < totalCommitted) {
          return NextResponse.json({ message: `Insufficient funds. You have ${user.currency.toLocaleString()} coins, but this bid would commit a total of ${totalCommitted.toLocaleString()} across all your bids.` }, { status: 400 });
        }

        // Add or update the bid
        if (!user.bids) {
            user.bids = {};
        }
        user.bids[playerId] = amount;

        await saveUser(user);

        return NextResponse.json({ message: `Bid of ${amount} for ${player.name} placed successfully.` });

    } catch (error: any) {
        console.error('Failed to place bid:', error);
        return NextResponse.json({ message: `Error placing bid: ${error.message}` }, { status: 500 });
    }
}
