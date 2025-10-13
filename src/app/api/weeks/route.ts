import { NextResponse } from 'next/server';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Get all weeks
export async function GET() {
  try {
    const { firestore } = initializeFirebase();
    const weeksSnapshot = await getDocs(collection(firestore, "weeks"));
    const weeks = weeksSnapshot.docs.map(doc => doc.data());
    return NextResponse.json(weeks);
  } catch (error) {
    console.error('Failed to read weeks data:', error);
    return NextResponse.json({ message: 'Error reading weeks data' }, { status: 500 });
  }
}

// Add a new week
export async function POST(request: Request) {
  try {
    const { firestore } = initializeFirebase();
    const newWeek = await request.json();

    const weekRef = doc(firestore, 'weeks', newWeek.id);
    await setDoc(weekRef, newWeek);
    
    return NextResponse.json(newWeek, { status: 201 });
  } catch (error) {
    console.error('Failed to create new week:', error);
    return NextResponse.json({ message: 'Error creating new week' }, { status: 500 });
  }
}
