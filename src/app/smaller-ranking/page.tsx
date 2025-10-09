'use client';

import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { User, Player } from '@/lib/types';
import { Award, DollarSign, Zap } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { PlayerIcon } from '@/components/icons/player-icon';

type HighestScoreInfo = {
  user: User;
  player: Player;
  score: number;
  week: string;
} | null;

type TopMMRPlayerInfo = {
    user: User;
    player: Player;
} | null;

export default function SmallerRankingsPage() {
  const { allUsers } = useUser();

  const highestScorePlayer = useMemo((): HighestScoreInfo => {
    if (!allUsers || allUsers.length === 0) return null;

    let topScore = 0;
    let topInfo: HighestScoreInfo = null;

    for (const user of allUsers) {
      if (!user.weeklyScores) continue;
      for (const playerId in user.weeklyScores) {
        const playerInRoster = user.players.find(p => (p as Player).id === playerId) as Player;
        if (!playerInRoster) continue;

        for (const weekId in user.weeklyScores[playerId]) {
          const scores = user.weeklyScores[playerId][weekId];
          const maxRaceScore = Math.max(scores.race1 || 0, scores.race2 || 0);

          if (maxRaceScore > topScore) {
            topScore = maxRaceScore;
            topInfo = {
              user: user,
              player: playerInRoster,
              score: topScore,
              week: weekId,
            };
          }
        }
      }
    }
    return topInfo;
  }, [allUsers]);

  const richestUser = useMemo((): User | null => {
    if (!allUsers || allUsers.length === 0) return null;
    return [...allUsers].sort((a, b) => b.currency - a.currency)[0];
  }, [allUsers]);

  const topMMRPlayer = useMemo((): TopMMRPlayerInfo => {
    if (!allUsers || allUsers.length === 0) return null;
    
    let topPlayer: Player | null = null;
    let owner: User | null = null;

    for (const user of allUsers) {
        for (const player of user.players as Player[]) {
            if (!topPlayer || (player.mmr || 0) > (topPlayer.mmr || 0)) {
                topPlayer = player;
                owner = user;
            }
        }
    }
    
    if (topPlayer && owner) {
        return { user: owner, player: topPlayer };
    }

    return null;
  }, [allUsers]);

  if (allUsers.length === 0) {
    return <div className="flex h-full items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Smaller Rankings</h1>
        <p className="text-muted-foreground mt-2">
          Special achievements and fun leaderboards from the league.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              <span>Highest Single Race Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {highestScorePlayer ? (
              <div className="flex items-center gap-4">
                <PlayerIcon iconName={highestScorePlayer.player.icon} className="w-16 h-16" />
                <div>
                  <p className="text-3xl font-bold text-primary">{highestScorePlayer.score}</p>
                  <p className="font-semibold">{highestScorePlayer.player.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Owned by {highestScorePlayer.user.name} (Week {highestScorePlayer.week})
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No scores recorded yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-500" />
              <span>Richest User</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
             {richestUser ? (
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-green-500"/>
                 </div>
                <div>
                  <p className="text-3xl font-bold text-green-500">{richestUser.currency.toLocaleString()}</p>
                  <p className="font-semibold">{richestUser.name}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No users found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-500" />
              <span>Top MMR Player</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topMMRPlayer ? (
                 <div className="flex items-center gap-4">
                    <PlayerIcon iconName={topMMRPlayer.player.icon} className="w-16 h-16" />
                    <div>
                        <p className="text-3xl font-bold text-blue-500">{topMMRPlayer.player.mmr?.toLocaleString()}</p>
                        <p className="font-semibold">{topMMRPlayer.player.name}</p>
                        <p className="text-sm text-muted-foreground">
                            Owned by {topMMRPlayer.user.name}
                        </p>
                    </div>
              </div>
            ) : (
                 <p className="text-muted-foreground">No players with MMR owned.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
