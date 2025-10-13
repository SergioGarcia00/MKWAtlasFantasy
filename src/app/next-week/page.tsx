'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

interface Week {
  id: string;
  name: string;
}

async function createNewWeek(db: any, newWeek: Week): Promise<Week | null> {
    try {
        const response = await fetch('/api/weeks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newWeek),
        });
        if (!response.ok) {
            console.error('Failed to create week');
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating week:', error);
        return null;
    }
}

export default function WeeksListPage() {
  const firestore = useFirestore();
  const weeksCollection = useMemoFirebase(() => firestore ? collection(firestore, 'weeks'): null, [firestore]);
  const { data: weeks, isLoading } = useCollection<Week>(weeksCollection);

  const handleCreateNewWeek = async () => {
    if (!weeks || !firestore) return;
    const newWeekId = (weeks.length + 1).toString();
    const newWeek = { id: newWeekId, name: `Week ${newWeekId}` };
    await createNewWeek(firestore, newWeek);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
            <h1 className="text-4xl font-bold font-headline">Weekly Summaries</h1>
            <p className="text-muted-foreground mt-2">
            Select a week to view user lineups and scores.
            </p>
        </div>
        <Button onClick={handleCreateNewWeek}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Week
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {weeks && weeks.map(week => (
          <Link href={`/weeks/${week.id}`} key={week.id} className="block">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{week.name}</CardTitle>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
