
'use server';

import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export async function GET(request: Request) {
    try {
        const { firestore } = initializeFirebase();

        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        const users = usersSnapshot.docs.map(doc => doc.data());

        const marketSnapshot = await getDocs(collection(firestore, 'market'));
        const dailyMarket = marketSnapshot.docs.map(doc => doc.data());

        const weeksSnapshot = await getDocs(collection(firestore, 'weeks'));
        const weeks = weeksSnapshot.docs.map(doc => doc.data());

        const exportData = {
            users,
            daily_market: dailyMarket,
            weeks,
        };

        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.set('Content-Disposition', 'attachment; filename="data_export.json"');

        return new NextResponse(JSON.stringify(exportData, null, 2), { headers });

    } catch (error) {
        console.error('Failed to export data:', error);
        return NextResponse.json({ message: 'Error exporting data' }, { status: 500 });
    }
}
