'use client';

import React, { useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DollarSign, Users, Trophy, Shield, Crown, ArrowRight, BarChart, TrendingUp, Sparkles } from 'lucide-react';
import { PlayerIcon } from '@/components/icons/player-icon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { User, Player } from '@/lib/types';

// --- Data Calculation Functions ---

const calculateUserTotalScore = (user: User | null): number => {
  if (!user?.weeklyScores) return 0;
  return Object.values(user.weeklyScores).reduce((total, playerScores) => {
    return total + Object.values(playerScores).reduce((playerTotal, week) => {
      return playerTotal + (week.race1 || 0) + (week.race2 || 0);
    }, 0);
  }, 0);
};

const getPlayerTotalScore = (playerId: string, allUsers: User[]): number => {
    let totalScore = 0;
    for (const user of allUsers) {
        if (user.weeklyScores?.[playerId]) {
            for (const weekId in user.weeklyScores[playerId]) {
                const scores = user.weeklyScores[playerId][weekId];
                totalScore += (scores.race1 || 0) + (scores.race2 || 0);
            }
            // Found the player's scores, no need to check other users
            return totalScore;
        }
    }
    return totalScore;
};

const getRosterValue = (user: User | null, getPlayerById: (id: string) => Player | undefined): number => {
    if (!user) return 0;
    return user.players.reduce((total, userPlayer) => {
        const player = getPlayerById(userPlayer.id);
        return total + (player?.cost || 0);
    }, 0);
};

// --- Main Dashboard Component ---

export default function DashboardPage() {
  const { user, allUsers, getPlayerById } = useUser();

  const { rankedUsers, userRank, topPlayer, mostValuableRosterUser } = useMemo(() => {
    if (!allUsers.length) return { rankedUsers: [], userRank: 'N/A', topPlayer: null, mostValuableRosterUser: null };

    // --- User Rankings ---
    const usersWithScores = allUsers
      .map(u => ({ ...u, totalScore: calculateUserTotalScore(u) }))
      .filter(u => u.roster.lineup.length >= 6)
      .sort((a, b) => b.totalScore - a.totalScore);
    
    const rankIndex = usersWithScores.findIndex(u => u.id === user?.id);
    const rank = rankIndex !== -1 ? `#${rankIndex + 1}` : 'N/A';

    // --- Top Player of the Week ---
    let topPlayerInfo: { player: Player, score: number, owner: User } | null = null;
    let highestScore = 0;

    allUsers.forEach(u => {
        u.roster.lineup.forEach(playerId => {
            const totalScore = getPlayerTotalScore(playerId, allUsers);
            if (totalScore > highestScore) {
                const player = getPlayerById(playerId);
                if(player) {
                    highestScore = totalScore;
                    topPlayerInfo = { player, score: totalScore, owner: u };
                }
            }
        });
    });

    // --- Most Valuable Roster ---
    const usersWithRosterValue = allUsers
        .map(u => ({ ...u, rosterValue: getRosterValue(u, getPlayerById) }))
        .sort((a, b) => b.rosterValue - a.rosterValue);

    return {
        rankedUsers: usersWithScores,
        userRank: rank,
        topPlayer: topPlayerInfo,
        mostValuableRosterUser: usersWithRosterValue[0] || null
    };
  }, [allUsers, user, getPlayerById]);

  // --- User-specific Calculations ---
  const userTotalScore = useMemo(() => calculateUserTotalScore(user), [user]);
  const userRosterValue = useMemo(() => getRosterValue(user, getPlayerById), [user, getPlayerById]);
  
  const starPlayer = useMemo(() => {
    if (!user || user.roster.lineup.length === 0) return null;
    return user.roster.lineup
      .map(id => getPlayerById(id))
      .filter((p): p is Player => !!p)
      .map(p => ({ player: p, score: getPlayerTotalScore(p.id, allUsers) }))
      .sort((a, b) => b.score - a.score)[0];
  }, [user, getPlayerById, allUsers]);


  if (!user) {
    return <div className="flex h-screen items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const stats = [
    { title: 'Fantasy Coins', value: user.currency.toLocaleString(), icon: <DollarSign className="text-green-500" /> },
    { title: 'Roster Value', value: userRosterValue.toLocaleString(), icon: <BarChart className="text-blue-500" /> },
    { title: 'Players Owned', value: `${user.players.length} / 10`, icon: <Shield className="text-red-500" /> },
    { title: 'League Players', value: allUsers.length, icon: <Users className="text-orange-500" /> },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-4xl font-bold font-headline">Welcome, {user.name}!</h1>
            <p className="text-muted-foreground mt-2">Here's your league snapshot.</p>
        </div>
        <div className="flex items-center gap-4">
            <Card className="flex items-center gap-4 p-3 bg-secondary">
                <Trophy className="w-6 h-6 text-amber-500"/>
                <div>
                    <p className="text-xs text-muted-foreground">Your Rank</p>
                    <p className="font-bold text-xl">{userRank}</p>
                </div>
            </Card>
             <Card className="flex items-center gap-4 p-3 bg-secondary">
                <Sparkles className="w-6 h-6 text-primary"/>
                <div>
                    <p className="text-xs text-muted-foreground">Total Score</p>
                    <p className="font-bold text-xl">{userTotalScore.toLocaleString()}</p>
                </div>
            </Card>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
            {/* Your Star Player */}
            {starPlayer && starPlayer.player ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Your Star Player</CardTitle>
                        <CardDescription>The highest-scoring player in your current lineup.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-gradient-to-r from-primary/10 to-secondary rounded-lg">
                            <PlayerIcon iconName={starPlayer.player.icon} className="w-24 h-24 text-primary" />
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-bold">{starPlayer.player.name}</h3>
                                <p className="text-muted-foreground">{starPlayer.player.mmr?.toLocaleString()} MMR</p>
                                <Separator className="my-3"/>
                                <div className="flex items-center justify-center md:justify-start gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total Score</p>
                                        <p className="font-bold text-2xl text-primary">{starPlayer.score.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Cost</p>
                                        <p className="font-bold text-2xl">{starPlayer.player.cost.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="flex items-center justify-center text-center p-10">
                    <div>
                        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Your lineup is empty!</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Go to your roster to add players and select a lineup.</p>
                        <Button asChild className="mt-4">
                            <Link href="/roster">Manage Roster</Link>
                        </Button>
                    </div>
                </Card>
            )}

             {/* League Honors */}
            <Card>
                <CardHeader>
                    <CardTitle>League Honors</CardTitle>
                    <CardDescription>Highlighting top performers across the league.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-secondary rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                           <Trophy className="w-5 h-5 text-amber-500"/>
                           <h4 className="font-semibold">Top Player of the Week</h4>
                        </div>
                        {topPlayer ? (
                             <div className="flex items-center gap-3">
                                <PlayerIcon iconName={topPlayer.player.icon} className="w-10 h-10"/>
                                <div>
                                    <p className="font-semibold">{topPlayer.player.name}</p>
                                    <p className="text-xs text-muted-foreground">Owned by {topPlayer.owner.name}</p>
                                </div>
                                <p className="ml-auto font-bold text-xl text-primary">{topPlayer.score}</p>
                             </div>
                        ) : <p className="text-sm text-muted-foreground">No scores recorded yet.</p>}
                    </div>
                     <div className="p-4 bg-secondary rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                           <Crown className="w-5 h-5 text-blue-500"/>
                           <h4 className="font-semibold">Most Valuable Roster</h4>
                        </div>
                        {mostValuableRosterUser ? (
                             <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>{mostValuableRosterUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{mostValuableRosterUser.name}</p>
                                    <p className="text-xs text-muted-foreground">Total Cost</p>
                                </div>
                                <p className="ml-auto font-bold text-xl text-primary">{getRosterValue(mostValuableRosterUser, getPlayerById).toLocaleString()}</p>
                             </div>
                        ) : <p className="text-sm text-muted-foreground">No users available.</p>}
                    </div>
                </CardContent>
            </Card>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-8">
            {/* Your Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Stats</CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.map((stat) => (
                        <div key={stat.title} className="flex items-center justify-between py-3 border-b last:border-none">
                            <div className="flex items-center gap-3 text-sm">
                                {stat.icon}
                                <span className="font-medium">{stat.title}</span>
                            </div>
                            <span className="font-bold text-lg">{stat.value}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-4">
                <Card className="bg-accent text-accent-foreground overflow-hidden">
                    <CardHeader>
                        <CardTitle>Auction House</CardTitle>
                        <CardDescription className="text-accent-foreground/80">Bid on superstars for your team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full bg-background text-foreground hover:bg-background/90">
                            <Link href="/daily-market">Go to Daily Market <ArrowRight className="ml-2"/></Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Manage Roster</CardTitle>
                        <CardDescription>Set your lineup for the next week.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/roster">Set Lineup <ArrowRight className="ml-2"/></Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}

    