
'use server';

import { NextResponse } from 'next/server';
import { collection, doc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

async function clearCollection(db: any, collectionPath: string) {
    const q = collection(db, collectionPath);
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}

export async function POST(request: Request) {
    try {
        const { firestore } = initializeFirebase();
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
        }
        
        if (file.type !== 'application/json') {
             return NextResponse.json({ message: 'Invalid file type. Please upload a JSON file.' }, { status: 400 });
        }

        const content = await file.text();
        const data = JSON.parse(content);
        
        const requiredKeys = ['users', 'daily_market', 'weeks'];
        for (const key of requiredKeys) {
            if (!data.hasOwnProperty(key)) {
                 return NextResponse.json({ message: `Invalid JSON format. Missing key: "${key}"` }, { status: 400 });
            }
        }
        
        // --- Start Data Overwrite ---
        await clearCollection(firestore, 'users');
        await clearCollection(firestore, 'market');
        await clearCollection(firestore, 'weeks');

        const batch = writeBatch(firestore);

        data.users.forEach((user: any) => {
            const userRef = doc(firestore, 'users', user.id);
            batch.set(userRef, user);
        });
        
        data.daily_market.forEach((player: any) => {
            const marketRef = doc(firestore, 'market', player.id);
            batch.set(marketRef, player);
        });

        data.weeks.forEach((week: any) => {
            const weekRef = doc(firestore, 'weeks', week.id);
            batch.set(weekRef, week);
        });

        await batch.commit();
        
        return NextResponse.json({ message: 'Data imported successfully! The application data has been updated.' });

    } catch (error: any) {
        console.error('Failed to import data:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid JSON file. Please check the file content.' }, { status: 400 });
        }
        return NextResponse.json({ message: `Error importing data: ${error.message}` }, { status: 500 });
    }
}
