'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';

interface Week {
  id: string;
  name: string;
}

async function fetchWeeks(): Promise<Week[]> {
  try {
    const response = await fetch('/api/weeks');
    if (!response.ok) {
      console.error('Failed to fetch weeks');
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching weeks:', error);
    return [];
  }
}

async function createNewWeek(newWeek: Week): Promise<Week | null> {
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
  const [weeks, setWeeks] = useState<Week[]>([]);

  useEffect(() => {
    async function loadWeeks() {
      const weeksData = await fetchWeeks();
      setWeeks(weeksData);
    }
    loadWeeks();
  }, []);

  const handleCreateNewWeek = async () => {
    const newWeekId = (weeks.length + 1).toString();
    const newWeek = { id: newWeekId, name: `Week ${newWeekId}` };
    const createdWeek = await createNewWeek(newWeek);
    if (createdWeek) {
        setWeeks(prevWeeks => [...prevWeeks, createdWeek]);
    }
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
        {weeks.map(week => (
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
