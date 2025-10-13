import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { User, UserPlayer } from '@/lib/types';

// This function remains to hydrate older data structures if needed, but is not actively used for fetching.
const hydratePlayer = (p: string | UserPlayer): UserPlayer => {
    if (typeof p === 'string') {
        return { id: p, purchasedAt: Date.now() - (15 * 24 * 60 * 60 * 1000) }; 
    }
    return p;
};

export async function GET(request: Request) {
  try {
    const { firestore } = initializeFirebase();
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    
    const users = usersSnapshot.docs.map(doc => {
        const user = doc.data() as User;
        // Ensure data consistency for older data structures
        user.id = doc.id;
        user.players = (user.players || []).map(hydratePlayer);
        user.roster = {
            lineup: user.roster?.lineup || [],
            bench: user.roster?.bench || [],
        }
        user.weeklyScores = user.weeklyScores || {};
        user.bids = user.bids || {};
        return user;
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    // It's better to return a more informative error message.
    return NextResponse.json({ message: `Error fetching users: ${ (error as Error).message }` }, { status: 500 });
  }
}
