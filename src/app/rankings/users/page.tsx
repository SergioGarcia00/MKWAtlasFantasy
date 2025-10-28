
'use client';

import { useMemo } from 'react';
import type { User, Player } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { useUser } from '@/context/user-context';

const calculateUserTotalScore = (user: User): number => {
    if (!user.weeklyScores) return 0;
    let totalScore = 0;
    for (const playerId in user.weeklyScores) {
        const playerScoresByWeek = user.weeklyScores[playerId];
        for (const weekId in playerScoresByWeek) {
            const scores = playerScoresByWeek[weekId];
            totalScore += (scores?.race1 || 0) + (scores?.race2 || 0);
        }
    }
    return totalScore;
};


export default function UserRankingsPage() {
  const { allUsers } = useUser();

  const rankedUsers = useMemo(() => {
    if (!allUsers) return [];
    
    return allUsers.map(user => ({
      ...user,
      totalScore: calculateUserTotalScore(user),
    }))
      .filter(user => user.roster.lineup.length >= 6) // Only rank users with a full lineup
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [allUsers]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-orange-600" />;
    return <span className="font-mono text-sm text-muted-foreground">{rank}</span>;
  };

  if (!allUsers || allUsers.length === 0) {
      return (
        <div className="flex h-48 items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
  }

  return (
    <div className="w-full">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] text-center">Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-center">Players in Lineup</TableHead>
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
                  <TableCell className="font-semibold">{user.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={user.roster.lineup.length === 6 ? "default" : "secondary"}>
                      {user.roster.lineup.length} / 6
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg text-primary">{user.totalScore.toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
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

    