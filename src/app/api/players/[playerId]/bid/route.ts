'use server';

import { NextResponse } from 'next/server';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { User } from '@/lib/types';

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
    
    const { firestore } = initializeFirebase();

    // Get all users to check for highest bid
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    const allUsers = usersSnapshot.docs.map(doc => doc.data() as User);
    
    let highestBid = 0;
    for (const user of allUsers) {
        if (user.bids && user.bids[playerId]) {
            highestBid = Math.max(highestBid, user.bids[playerId]);
        }
    }

    if (bidAmount <= highestBid) {
        return NextResponse.json({ message: `Your bid must be higher than the current highest bid of ${highestBid.toLocaleString()}.` }, { status: 400 });
    }

    const bidderRef = doc(firestore, 'users', userId);
    const bidderDoc = await getDoc(bidderRef);

    if (!bidderDoc.exists()) {
      return NextResponse.json({ message: 'Bidder not found' }, { status: 404 });
    }
    
    const bidder = bidderDoc.data() as User;

    if(bidder.players.some(p => p.id === playerId)) {
        return NextResponse.json({ message: "You can't bid on a player you already own." }, { status: 400 });
    }

    const otherBidsAmount = Object.entries(bidder.bids || {})
      .filter(([pId]) => pId !== playerId)
      .reduce((sum, [, amount]) => sum + amount, 0);

    if (bidder.currency < (otherBidsAmount + bidAmount)) {
        return NextResponse.json({ message: 'Insufficient funds for this bid considering your other active bids.' }, { status: 400 });
    }
    
    // Use dot notation to update a specific field in the map
    await setDoc(bidderRef, { bids: { [playerId]: bidAmount } }, { merge: true });

    return NextResponse.json({ message: 'Bid placed successfully' });

  } catch (error) {
    console.error('Failed to place bid:', error);
    return NextResponse.json({ message: 'Error placing bid' }, { status: 500 });
  }
}
