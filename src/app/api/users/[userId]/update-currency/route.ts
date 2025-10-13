
'use server';

import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { User } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { amount, isReset } = await request.json();

    if (!userId || typeof amount !== 'number') {
      return NextResponse.json({ message: 'User ID and amount are required' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
        return NextResponse.json({ message: `User ${userId} not found` }, { status: 404 });
    }
    
    const user = userDoc.data() as User;
    let newCurrency;

    if (isReset) {
        newCurrency = amount;
    } else {
        newCurrency = (user.currency || 0) + amount;
    }

    await updateDoc(userRef, { currency: newCurrency });
    
    const updatedUser = { ...user, currency: newCurrency };
    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Failed to update currency:', error);
    return NextResponse.json({ message: 'Error updating currency' }, { status: 500 });
  }
}
