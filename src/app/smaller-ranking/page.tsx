'use client';

import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User, Player } from '@/lib/types';
import { Award, DollarSign, Zap, TrendingUp, Gem, Bomb, WalletCards, Anchor, Frown, Handshake } from 'lucide-react';
import { useMemo } from 'react';
import { PlayerIcon } from '@/components/icons/player-icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ScoreInfo = {
  user: User;
  player: Player;
  score: number;
  week: string;
} | null;

type TopMMRPlayerInfo = {
    user: User;
    player: Player;
} | null;

type UserWithValue = User & { value: number };

type MoneyGrabberInfo = {
  user: User;
  player: Player;
  ratio: number;
} | null;

const calculatePlayerTotalScore = (playerId: string, allUsers: User[]): number => {
    let totalScore = 0;
    for (const user of allUsers) {
        if (user.weeklyScores && user.weeklyScores[playerId]) {
            for (const week in user.weeklyScores[playerId]) {
                const scores = user.weeklyScores[playerId][week];
                totalScore += (scores.race1 || 0) + (scores.race2 || 0);
            }
            // A player can only be on one user's roster, so we can break after finding them.
            return totalScore; 
        }
    }
    return totalScore;
};

export default function SmallerRankingsPage() {
  const { allUsers, getPlayerById } = useUser();

  const scoreStats = useMemo((): {highest: ScoreInfo, lowest: ScoreInfo} => {
    if (!allUsers || allUsers.length === 0) return { highest: null, lowest: null };

    let topScore = 0;
    let topInfo: ScoreInfo = null;
    let bottomScore = Infinity;
    let bottomInfo: ScoreInfo = null;

    for (const user of allUsers) {
      if (!user.weeklyScores) continue;
      for (const playerId in user.weeklyScores) {
        const playerInRoster = getPlayerById(playerId);
        if (!playerInRoster) continue;

        for (const weekId in user.weeklyScores[playerId]) {
          const scores = user.weeklyScores[playerId][weekId];
          const race1Score = scores.race1 || 0;
          const race2Score = scores.race2 || 0;

          if (race1Score > 0) {
            if (race1Score > topScore) {
              topScore = race1Score;
              topInfo = { user, player: playerInRoster, score: topScore, week: weekId };
            }
            if (race1Score < bottomScore) {
              bottomScore = race1Score;
              bottomInfo = { user, player: playerInRoster, score: bottomScore, week: weekId };
            }
          }

          if (race2Score > 0) {
             if (race2Score > topScore) {
              topScore = race2Score;
              topInfo = { user, player: playerInRoster, score: topScore, week: weekId };
            }
            if (race2Score < bottomScore) {
              bottomScore = race2Score;
              bottomInfo = { user, player: playerInRoster, score: bottomScore, week: weekId };
            }
          }
        }
      }
    }
    return { highest: topInfo, lowest: bottomInfo };
  }, [allUsers, getPlayerById]);


  const rankedUsersByCurrency = useMemo((): User[] => {
    if (!allUsers || allUsers.length === 0) return [];
    return [...allUsers].sort((a, b) => b.currency - a.currency);
  }, [allUsers]);

  const topMMRPlayer = useMemo((): TopMMRPlayerInfo => {
    if (!allUsers || allUsers.length === 0) return null;
    
    let topPlayer: Player | null = null;
    let owner: User | null = null;

    for (const user of allUsers) {
        for (const userPlayer of user.players) {
            const player = getPlayerById(userPlayer.id);
            if (player && (!topPlayer || (player.mmr || 0) > (topPlayer.mmr || 0))) {
                topPlayer = player;
                owner = user;
            }
        }
    }
    
    if (topPlayer && owner) {
        return { user: owner, player: topPlayer };
    }

    return null;
  }, [allUsers, getPlayerById]);
  
  const rosterValueRankings = useMemo((): {mostValuable: UserWithValue | null, leastValuable: UserWithValue | null} => {
    if (!allUsers || allUsers.length === 0) return { mostValuable: null, leastValuable: null };

    const usersWithRosterValue = allUsers.map(user => {
      const rosterValue = user.players
        .map(p => getPlayerById(p.id)?.cost || 0)
        .reduce((sum, cost) => sum + cost, 0);
      return { ...user, value: rosterValue };
    }).sort((a, b) => b.value - a.value);

    return {
        mostValuable: usersWithRosterValue[0] || null,
        leastValuable: usersWithRosterValue[usersWithRosterValue.length - 1] || null
    }

  }, [allUsers, getPlayerById]);

  const topPeakPerformanceTeam = useMemo((): UserWithValue | null => {
    if (!allUsers || allUsers.length === 0) return null;

    return allUsers.map(user => {
        const peakMMRSum = user.roster.lineup
            .map(pId => getPlayerById(pId)?.peak_mmr || 0)
            .reduce((sum, mmr) => sum + mmr, 0);
        return { ...user, value: peakMMRSum };
    }).sort((a, b) => b.value - a.value)[0];
  }, [allUsers, getPlayerById]);

  const moneyGrabber = useMemo((): MoneyGrabberInfo => {
    if (!allUsers || allUsers.length === 0) return null;

    let worstPlayer: MoneyGrabberInfo = null;
    let maxRatio = -1;

    for (const user of allUsers) {
        for (const userPlayer of user.players) {
            const player = getPlayerById(userPlayer.id);
            if (!player) continue;

            const totalScore = calculatePlayerTotalScore(player.id, allUsers);
            
            // Only consider players who have scores recorded to avoid division by zero
            if (totalScore > 0) {
                const ratio = player.cost / totalScore;
                if (ratio > maxRatio) {
                    maxRatio = ratio;
                    worstPlayer = { user, player, ratio };
                }
            }
        }
    }
    return worstPlayer;
  }, [allUsers, getPlayerById]);

  const poorestUser = rankedUsersByCurrency[rankedUsersByCurrency.length - 1];

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              <span>Highest Single Race Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scoreStats.highest ? (
              <div className="flex items-center gap-4">
                <PlayerIcon iconName={scoreStats.highest.player.icon} className="w-16 h-16" />
                <div>
                  <p className="font-semibold">{scoreStats.highest.player.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Owned by {scoreStats.highest.user.name} (Week {scoreStats.highest.week})
                  </p>
                  <p className="text-3xl font-bold text-primary mt-1">{scoreStats.highest.score}</p>
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
              <Zap className="w-6 h-6 text-blue-500" />
              <span>Top MMR Player</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topMMRPlayer ? (
                 <div className="flex items-center gap-4">
                    <PlayerIcon iconName={topMMRPlayer.player.icon} className="w-16 h-16" />
                    <div>
                        <p className="font-semibold">{topMMRPlayer.player.name}</p>
                         <p className="text-sm text-muted-foreground">
                            Owned by {topMMRPlayer.user.name}
                        </p>
                        <p className="text-3xl font-bold text-blue-500">{topMMRPlayer.player.mmr?.toLocaleString()}</p>
                    </div>
              </div>
            ) : (
                 <p className="text-muted-foreground">No players with MMR owned.</p>
            )}
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gem className="w-6 h-6 text-emerald-500" />
              <span>Most Valuable Roster</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rosterValueRankings.mostValuable ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center font-bold text-xl">{rosterValueRankings.mostValuable.name.substring(0, 2)}</div>
                <div>
                  <p className="font-semibold">{rosterValueRankings.mostValuable.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Total Roster Value
                  </p>
                  <p className="text-3xl font-bold text-emerald-500 mt-1">{rosterValueRankings.mostValuable.value.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No rosters to value yet.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-rose-500" />
              <span>Highest Peak Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPeakPerformanceTeam ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center font-bold text-xl">{topPeakPerformanceTeam.name.substring(0, 2)}</div>
                <div>
                  <p className="font-semibold">{topPeakPerformanceTeam.name}</p>
                   <p className="text-sm text-muted-foreground">
                    Combined Lineup Peak MMR
                  </p>
                  <p className="text-3xl font-bold text-rose-500 mt-1">{topPeakPerformanceTeam.value.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No lineups to rank yet.</p>
            )}
          </CardContent>
        </Card>

      </div>
      
       <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bomb className="w-6 h-6 text-red-500" />
              <span>Lowest Single Race Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scoreStats.lowest ? (
              <div className="flex items-center gap-4">
                <PlayerIcon iconName={scoreStats.lowest.player.icon} className="w-16 h-16" />
                <div>
                  <p className="font-semibold">{scoreStats.lowest.player.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Owned by {scoreStats.lowest.user.name} (Week {scoreStats.lowest.week})
                  </p>
                  <p className="text-3xl font-bold text-red-500 mt-1">{scoreStats.lowest.score}</p>
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
              <Frown className="w-6 h-6 text-gray-500" />
              <span>Least Valuable Roster</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rosterValueRankings.leastValuable ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center font-bold text-xl">{rosterValueRankings.leastValuable.name.substring(0, 2)}</div>
                <div>
                  <p className="font-semibold">{rosterValueRankings.leastValuable.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Total Roster Value
                  </p>
                  <p className="text-3xl font-bold text-gray-500 mt-1">{rosterValueRankings.leastValuable.value.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No rosters to value yet.</p>
            )}
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletCards className="w-6 h-6 text-orange-500" />
              <span>Poorest User</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {poorestUser ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center font-bold text-xl">{poorestUser.name.substring(0, 2)}</div>
                <div>
                  <p className="font-semibold">{poorestUser.name}</p>
                   <p className="text-sm text-muted-foreground">
                    Fantasy Coins
                  </p>
                  <p className="text-3xl font-bold text-orange-500 mt-1">{poorestUser.currency.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No users to rank.</p>
            )}
          </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Handshake className="w-6 h-6 text-teal-500" />
                <span>Money Grabber</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {moneyGrabber ? (
                <div className="flex items-center gap-4">
                    <PlayerIcon iconName={moneyGrabber.player.icon} className="w-16 h-16" />
                    <div>
                    <p className="font-semibold">{moneyGrabber.player.name}</p>
                    <p className="text-sm text-muted-foreground">
                        Owned by {moneyGrabber.user.name}
                    </p>
                    <p className="text-3xl font-bold text-teal-500 mt-1">
                        {Math.round(moneyGrabber.ratio).toLocaleString()}
                        <span className="text-base font-normal text-muted-foreground"> coins/point</span>
                    </p>
                    </div>
                </div>
                ) : (
                <p className="text-muted-foreground">No players with scores yet.</p>
                )}
            </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-500" />
                    <span>Richest Users</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-[80px] text-center">Rank</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead className="text-right">Fantasy Coins</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rankedUsersByCurrency.map((user, index) => (
                            <TableRow key={user.id}>
                                <TableCell className="text-center font-medium">{index + 1}</TableCell>
                                <TableCell className="font-semibold">{user.name}</TableCell>
                                <TableCell className="text-right font-bold text-lg text-green-500">{user.currency.toLocaleString()}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
