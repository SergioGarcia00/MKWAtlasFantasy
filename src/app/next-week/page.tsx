'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function WeeksListPage() {
  // Start with one week and allow adding more.
  const [weeks, setWeeks] = useState([
    { id: '1', name: 'Week 1' },
  ]);

  const handleCreateNewWeek = () => {
    const newWeekId = (weeks.length + 1).toString();
    const newWeek = { id: newWeekId, name: `Week ${newWeekId}` };
    setWeeks(prevWeeks => [...prevWeeks, newWeek]);
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
