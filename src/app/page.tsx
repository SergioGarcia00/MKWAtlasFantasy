'use client';

import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DollarSign, Users, Trophy, Shield } from 'lucide-react';
import { PlayerIcon } from '@/components/icons/player-icon';
import { useEffect, useState } from 'react';
import type { User, Player } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';

const calculateTotalScore = (user: User) => {
  if (!user.roster || !user.roster.lineup) return 0;
  return user.roster.lineup.reduce((total: number, player: Player | string) => {
    if (typeof player === 'string' || !player) return total;
    const scores = user.weeklyScores[player.id];
    return total + (scores?.race1 || 0) + (scores?.race2 || 0);
  }, 0);
};

export default function DashboardPage() {
  const { user, allUsers } = useUser();
  const [allUsersWithScores, setAllUsersWithScores] = useState<(User & {totalScore: number})[]>([]);

  useEffect(() => {
    if (allUsers.length > 0) {
      const usersWithScores = allUsers.map(u => ({
        ...u,
        totalScore: calculateTotalScore(u as User),
      })).sort((a, b) => b.totalScore - a.totalScore);
      setAllUsersWithScores(usersWithScores as (User & {totalScore: number})[]);
    }
  }, [allUsers]);

  if (!user) {
    return <div className="flex h-full items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const userRank = allUsersWithScores.findIndex(u => u.id === user.id) + 1;


  const stats = [
    { title: 'Your Rank', value: `#${userRank > 0 ? userRank : 'N/A'}`, icon: <Trophy className="w-6 h-6 text-amber-500" /> },
    { title: 'League Players', value: allUsers.length, icon: <Users className="w-6 h-6 text-blue-500" /> },
    { title: 'Fantasy Coins', value: user.currency.toLocaleString(), icon: <DollarSign className="w-6 h-6 text-green-500" /> },
    { title: 'Players Owned', value: `${user.players.length} / 10`, icon: <Shield className="w-6 h-6 text-red-500" /> },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-headline">Welcome, {user.name}!</h1>
        <p className="text-muted-foreground mt-2">Here's a snapshot of your Kart Fantasy League.</p>
      </header>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Starting Lineup</CardTitle>
            <CardDescription>
              {user.roster.lineup.length > 0 ? 'Your team is ready for the next race!' : 'Your lineup is empty. Go to your roster to add players.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.roster.lineup.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(user.roster.lineup as Player[]).map(player => (
                  <div key={player.id} className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg text-center">
                    <PlayerIcon iconName={player.icon} className="w-16 h-16" />
                    <p className="mt-2 font-semibold text-sm">{player.name}</p>
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No players in your lineup.</p>
                <Button asChild variant="link" className="text-primary">
                  <Link href="/roster">Manage Roster</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
           <CardHeader>
            <CardTitle>Get More Players</CardTitle>
            <CardDescription>Expand your team and dominate the league.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center h-[calc(100%-80px)]">
            <div className="p-6 bg-primary/10 rounded-full mb-4">
              <Trophy className="w-12 h-12 text-primary" />
            </div>
            <p className="mb-4 text-muted-foreground">The store is full of talented racers waiting for a team.</p>
            <Button asChild className="bg-accent hover:bg-accent/90">
              <Link href="/store">Go to Store</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}