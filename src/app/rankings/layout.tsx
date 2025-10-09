'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RankingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Rankings</h1>
        <p className="text-muted-foreground mt-2">
          See how players and users stack up against each other.
        </p>
      </header>

      <Tabs value={pathname} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="/rankings" asChild>
            <Link href="/rankings/players">Player Rankings</Link>
          </TabsTrigger>
          <TabsTrigger value="/rankings/users" asChild>
            <Link href="/rankings/users">User Rankings</Link>
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
            {children}
        </div>
      </Tabs>
    </div>
  );
}
