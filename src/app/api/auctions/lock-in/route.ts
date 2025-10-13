'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { USER_IDS } from '@/data/users';
import type { User, UserPlayer } from '@/lib/types';

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
        
        const usersToUpdate = new Map<string, User>();
        users.forEach(u => usersToUpdate.set(u.id, JSON.parse(JSON.stringify(u)))); 

        for (const winner of winners) {
            const winningUser = usersToUpdate.get(winner.userId);
            if (winningUser && winningUser.players.length < 10) {
                if (winningUser.currency >= winner.amount) {
                    const newUserPlayer: UserPlayer = { id: winner.playerId, purchasedAt: Date.now() };
                    winningUser.players.push(newUserPlayer);

                    if(!winningUser.roster.bench.includes(winner.playerId)) {
                        winningUser.roster.bench.push(winner.playerId);
                    }
                    winningUser.currency -= winner.amount;
                }
            }
        }

        // 4. Clear all bids and write updates
        for (const user of usersToUpdate.values()) {
            user.bids = {};
            const userFilePath = path.join(USERS_DIR, `${user.id}.json`);
            await fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
        }

        return NextResponse.json({ message: 'Auctions locked in successfully', winners });

    } catch (error) {
        console.error('Failed to lock in auctions:', error);
        return NextResponse.json({ message: 'Error locking in auctions' }, { status: 500 });
    }
}
