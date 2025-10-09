'use client';

import { useMemo } from 'react';
import type { User } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { ALL_PLAYERS } from '@/data/players';

const calculateTotalScore = (user: User) => {
  if (!user.roster || user.roster.lineup.length < 6) return 0;
  return user.roster.lineup.reduce((total, player) => {
    if (!player) return total;
    const scores = user.weeklyScores[player.id];
    return total + (scores?.race1 || 0) + (scores?.race2 || 0);
  }, 0);
};

export default function UserRankingsPage() {
    const firestore = useFirestore();
    const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users')), [firestore]);
    const { data: users, isLoading } = useCollection<User>(usersQuery);

  const rankedUsers = useMemo(() => {
    if (!users) return [];

    const hydratedUsers = users.map(user => {
        const hydratedPlayers = user.players?.map(pId => ALL_PLAYERS.find(p => p.id === (pId as unknown as string)))
                                      .filter((p): p is Player => !!p) || [];
        const hydratedLineup = user.roster?.lineup.map(pId => ALL_PLAYERS.find(p => p.id === (pId as unknown as string)))
                                     .filter((p): p is Player => !!p) || [];
        const hydratedBench = user.roster?.bench.map(pId => ALL_PLAYERS.find(p => p.id === (pId as unknown as string)))
                                    .filter((p): p is Player => !!p) || [];
        return {
            ...user,
            players: hydratedPlayers,
            roster: {
                lineup: hydratedLineup,
                bench: hydratedBench
            }
        }
    });

    return hydratedUsers.map(user => ({
      ...user,
      totalScore: calculateTotalScore(user),
    }))
      .filter(user => user.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [users]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-orange-600" />;
    return <span className="font-mono text-sm text-muted-foreground">{rank}</span>;
  };

  if (isLoading) {
      return <div className="flex h-full items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="w-full">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Players in Lineup</TableHead>
              <TableHead className="text-right">Total Weekly Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedUsers.length > 0 ? (
              rankedUsers.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary">
                        {getRankBadge(index + 1)}
                    </div>
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.roster.lineup.length} / 6</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg text-primary">{user.totalScore.toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No users are eligible for ranking yet. A full lineup of 6 players is required.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
       <p className="text-xs text-muted-foreground mt-4">*Only users with a full lineup of 6 players are shown in the ranking.</p>
    </div>
  );
}
