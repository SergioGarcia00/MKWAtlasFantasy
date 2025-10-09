'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { User, Player, UserPlayer } from '@/lib/types';

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

async function updateUser(user: User): Promise<void> {
    const userFilePath = path.join(USERS_DIR, `${user.id}.json`);
    await fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
}

export async function POST(request: Request) {
    try {
        const users = await getAllUsers();
        
        // 1. Aggregate all bids
        const bidsByPlayer: Record<string, { userId: string, amount: number, userName: string }[]> = {};
        users.forEach(user => {
            if (user.bids) {
                Object.entries(user.bids).forEach(([playerId, amount]) => {
                    if (!bidsByPlayer[playerId]) {
                        bidsByPlayer[playerId] = [];
                    }
                    bidsByPlayer[playerId].push({ userId: user.id, userName: user.name, amount });
                });
            }
        });

        // 2. Determine winners
        const winners: { playerId: string; userId: string; amount: number; }[] = [];
        for (const playerId in bidsByPlayer) {
            const bids = bidsByPlayer[playerId];
            if (bids.length > 0) {
                const winningBid = bids.reduce((highest, current) => current.amount > highest.amount ? current : highest, bids[0]);
                winners.push({ playerId, userId: winningBid.userId, amount: winningBid.amount });
            }
        }
        
        // 3. Process transfers
        const usersToUpdate = new Map<string, User>();
        users.forEach(u => usersToUpdate.set(u.id, JSON.parse(JSON.stringify(u)))); // Deep copy

        for (const winner of winners) {
            const winningUser = usersToUpdate.get(winner.userId);
            if (winningUser && winningUser.players.length < 10) {
                 // Check if the user still has enough currency
                const totalBidAmount = Object.values(winningUser.bids || {}).reduce((sum, amount) => sum + amount, 0);

                if (winningUser.currency >= winner.amount) { // Check specific winning bid amount
                    // Add player to winner
                    const newUserPlayer: UserPlayer = { id: winner.playerId, purchasedAt: Date.now() };
                    winningUser.players.push(newUserPlayer);

                    // Add to bench if not already there
                    if(!winningUser.roster.bench.includes(winner.playerId)) {
                        winningUser.roster.bench.push(winner.playerId);
                    }

                    // Deduct currency
                    winningUser.currency -= winner.amount;

                }
            }
        }

        // 4. Clear all bids for all users
        for (const user of usersToUpdate.values()) {
            user.bids = {};
        }

        // 5. Save all updated user files
        await Promise.all(Array.from(usersToUpdate.values()).map(user => updateUser(user)));

        return NextResponse.json({ message: 'Auctions locked in successfully', winners });

    } catch (error) {
        console.error('Failed to lock in auctions:', error);
        return NextResponse.json({ message: 'Error locking in auctions' }, { status: 500 });
    }
}
