'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

// For now, we only have one week, but this can be expanded later.
const weeks = [
  { id: '1', name: 'Week 1' },
];

export default function WeeksListPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Weekly Summaries</h1>
        <p className="text-muted-foreground mt-2">
          Select a week to view user lineups and scores.
        </p>
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
