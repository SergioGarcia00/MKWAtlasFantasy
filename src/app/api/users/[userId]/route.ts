import { NextResponse } from 'next/server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { User, UserPlayer } from '@/lib/types';

const hydratePlayer = (p: string | UserPlayer): UserPlayer => {
    if (typeof p === 'string') {
        return { id: p, purchasedAt: Date.now() - (15 * 24 * 60 * 60 * 1000) }; 
    }
    return p;
};

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', userId);

  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
        return NextResponse.json({ message: `User ${userId} not found` }, { status: 404 });
    }
    
    const user = userDoc.data() as User;
    user.players = (user.players || []).map(hydratePlayer);
    return NextResponse.json(user);
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return NextResponse.json({ message: `Error fetching user ${userId}` }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', userId);

  try {
    const body: User = await request.json();
    await setDoc(userRef, body, { merge: true });
    return NextResponse.json(body);
  } catch (error) {
    console.error('Failed to update user data:', error);
    return NextResponse.json({ message: 'Error updating user data' }, { status: 500 });
  }
}
