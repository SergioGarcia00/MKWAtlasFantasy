'use server';

import { NextResponse } from 'next/server';
import { collection, getDocs, writeBatch, doc, addDoc, query, where, getDoc, deleteDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { ALL_PLAYERS } from '@/data/players';
import type { Player, User } from '@/lib/types';

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

async function getAllUsers(db: any): Promise<User[]> {
    const usersSnapshot = await getDocs(collection(db, "users"));
    return usersSnapshot.docs.map(doc => doc.data() as User);
}

export async function POST(request: Request) {
    try {
        const { firestore } = initializeFirebase();

        // Clear existing market
        const marketQuery = query(collection(firestore, 'market'));
        const marketSnapshot = await getDocs(marketQuery);
        const deleteBatch = writeBatch(firestore);
        marketSnapshot.docs.forEach(d => deleteBatch.delete(d.ref));
        await deleteBatch.commit();
        
        const allUsers = await getAllUsers(firestore);
        const allOwnedPlayerIds = new Set(allUsers.flatMap(u => u.players.map(p => p.id)));
        const availablePlayers = ALL_PLAYERS.filter(p => !allOwnedPlayerIds.has(p.id));
        
        const finalRecommendations = new Set<Player>();

        function addPlayersToSet(players: Player[], count: number) {
            const shuffled = shuffleArray([...players]);
            for(let i=0; i < shuffled.length && finalRecommendations.size < count; i++) {
                const player = shuffled[i];
                if (!finalRecommendations.has(player)) {
                    finalRecommendations.add(player);
                }
            }
        }
    
        const highCostPlayers = availablePlayers.filter(p => p.cost >= 4000);
        const midCostPlayers = availablePlayers.filter(p => p.cost >= 3000 && p.cost < 4000);
        const lowCostPlayers = availablePlayers.filter(p => p.cost < 3000);
    
        addPlayersToSet(highCostPlayers, 18);
        
        const newMarketPlayers = Array.from(finalRecommendations);

        // Save the new market to Firestore
        const marketBatch = writeBatch(firestore);
        newMarketPlayers.forEach(player => {
            const playerRef = doc(firestore, 'market', player.id);
            marketBatch.set(playerRef, player);
        });
        await marketBatch.commit();

        // Clear all bids for all users
        const userUpdateBatch = writeBatch(firestore);
        allUsers.forEach(user => {
            const userRef = doc(firestore, 'users', user.id);
            userUpdateBatch.update(userRef, { bids: {} });
        });
        await userUpdateBatch.commit();

        return NextResponse.json({ message: 'Daily market refreshed successfully', newMarket: newMarketPlayers });

    } catch (error) {
        console.error('Failed to refresh daily market:', error);
        return NextResponse.json({ message: 'Error refreshing market' }, { status: 500 });
    }
}
