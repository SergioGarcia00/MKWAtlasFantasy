'use client';

import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User, Player } from '@/lib/types';
import { Award, DollarSign, Zap, Gem, Bomb, Frown, Handshake, TrendingUp, WalletCards } from 'lucide-react';
import { useMemo } from 'react';
import { PlayerIcon } from '@/components/icons/player-icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  
  const HallOfFameCard = ({icon, title, player, user, value, valueLabel, week}: {icon: React.ReactNode, title: string, player?: Player | null, user?: User | null, value: React.ReactNode, valueLabel: string, week?:string}) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
                {icon}
                <span>{title}</span>
            </CardTitle>
        </CardHeader>
        <CardContent>
            {player && user ? (
                 <div className="flex items-center gap-4">
                    <PlayerIcon iconName={player.icon} className="w-16 h-16" />
                    <div>
                        <p className="font-semibold text-base">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                            Owned by {user.name} {week ? `(Week ${week})` : ''}
                        </p>
                        <p className="text-3xl font-bold text-primary mt-1">{value}</p>
                        <p className="text-xs text-muted-foreground">{valueLabel}</p>
                    </div>
              </div>
            ) : (
                 <p className="text-muted-foreground">No data available yet.</p>
            )}
        </CardContent>
    </Card>
  );

  const UserStatCard = ({icon, title, user, value, valueLabel}: {icon: React.ReactNode, title: string, user: UserWithValue | null, value: React.ReactNode, valueLabel: string}) => (
     <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
                {icon}
                <span>{title}</span>
            </CardTitle>
        </CardHeader>
        <CardContent>
             {user ? (
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-2xl">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-base">{user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {valueLabel}
                  </p>
                  <p className="text-3xl font-bold text-primary mt-1">{value}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No data available yet.</p>
            )}
        </CardContent>
    </Card>
  );


  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">League Honors</h1>
        <p className="text-muted-foreground mt-2">
          Special achievements and unique leaderboards from the league.
        </p>
      </header>

      {/* Hall of Fame */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold font-headline mb-4 pb-2 border-b-2 border-primary">Hall of Fame</h2>
        <div className="grid gap-6 md:grid-cols-2">
            <HallOfFameCard 
                icon={<Award className="w-6 h-6 text-amber-500" />}
                title="Highest Single Race Score"
                player={scoreStats.highest?.player}
                user={scoreStats.highest?.user}
                value={scoreStats.highest?.score}
                valueLabel="Points"
                week={scoreStats.highest?.week}
            />
            <HallOfFameCard 
                icon={<Zap className="w-6 h-6 text-blue-500" />}
                title="Top MMR Player"
                player={topMMRPlayer?.player}
                user={topMMRPlayer?.user}
                value={topMMRPlayer?.player?.mmr?.toLocaleString()}
                valueLabel="MMR"
            />
            <UserStatCard 
                icon={<Gem className="w-6 h-6 text-emerald-500" />}
                title="Most Valuable Roster"
                user={rosterValueRankings.mostValuable}
                value={rosterValueRankings.mostValuable?.value.toLocaleString()}
                valueLabel="Total Roster Value"
            />
             <UserStatCard 
                icon={<TrendingUp className="w-6 h-6 text-rose-500" />}
                title="Highest Peak Performance"
                user={topPeakPerformanceTeam}
                value={topPeakPerformanceTeam?.value.toLocaleString()}
                valueLabel="Combined Lineup Peak MMR"
            />
        </div>
      </div>
      
      {/* Hall of Shame */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold font-headline mb-4 pb-2 border-b-2 border-muted-foreground">Hall of Shame</h2>
        <div className="grid gap-6 md:grid-cols-2">
            <HallOfFameCard 
                icon={<Bomb className="w-6 h-6 text-red-500" />}
                title="Lowest Single Race Score"
                player={scoreStats.lowest?.player}
                user={scoreStats.lowest?.user}
                value={scoreStats.lowest?.score}
                valueLabel="Points"
                week={scoreStats.lowest?.week}
            />
             <UserStatCard 
                icon={<Frown className="w-6 h-6 text-gray-500" />}
                title="Least Valuable Roster"
                user={rosterValueRankings.leastValuable}
                value={rosterValueRankings.leastValuable?.value.toLocaleString()}
                valueLabel="Total Roster Value"
            />
             <UserStatCard 
                icon={<WalletCards className="w-6 h-6 text-orange-500" />}
                title="Poorest User"
                user={poorestUser ? {...poorestUser, value: poorestUser.currency} : null}
                value={poorestUser?.currency.toLocaleString()}
                valueLabel="Fantasy Coins"
            />
            <HallOfFameCard 
                icon={<Handshake className="w-6 h-6 text-teal-500" />}
                title="Money Grabber"
                player={moneyGrabber?.player}
                user={moneyGrabber?.user}
                value={`${Math.round(moneyGrabber?.ratio || 0).toLocaleString()}`}
                valueLabel="Coins per Point"
            />
        </div>
      </div>

       {/* Richest Users */}
      <div>
        <h2 className="text-2xl font-semibold font-headline mb-4">Richest Users</h2>
        <Card className="col-span-1 lg:col-span-2">
            <CardContent className="p-0">
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
