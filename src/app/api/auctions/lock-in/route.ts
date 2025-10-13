'use server';

import { NextResponse } from 'next/server';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { User, UserPlayer } from '@/lib/types';

async function getAllUsers(db: any): Promise<User[]> {
    const usersSnapshot = await getDocs(collection(db, "users"));
    return usersSnapshot.docs.map(doc => doc.data() as User);
}

export async function POST(request: Request) {
    try {
        const { firestore } = initializeFirebase();
        const users = await getAllUsers(firestore);
        
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
        
        // 3. Process transfers using a batch write
        const batch = writeBatch(firestore);
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

        // 4. Clear all bids and apply updates
        for (const user of usersToUpdate.values()) {
            user.bids = {};
            const userRef = doc(firestore, "users", user.id);
            batch.set(userRef, user);
        }

        await batch.commit();

        return NextResponse.json({ message: 'Auctions locked in successfully', winners });

    } catch (error) {
        console.error('Failed to lock in auctions:', error);
        return NextResponse.json({ message: 'Error locking in auctions' }, { status: 500 });
    }
}
