import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export async function GET(request: Request) {
    try {
        const { firestore } = initializeFirebase();
        const marketSnapshot = await getDocs(collection(firestore, "market"));
        const marketPlayers = marketSnapshot.docs.map(doc => doc.data());
        return NextResponse.json(marketPlayers);
    } catch (error) {
        console.error('Failed to read daily market data:', error);
        return NextResponse.json({ message: 'Error reading market data' }, { status: 500 });
    }
}
