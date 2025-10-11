'use client';

import React from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DollarSign, Users, Trophy, Shield, Crown, ArrowRight, Newspaper, Loader2 } from 'lucide-react';
import { PlayerIcon } from '@/components/icons/player-icon';
import { useEffect, useState, useMemo } from 'react';
import type { User, Player } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { newsFeedMessages } from '@/lib/news-feed';


const calculateTotalScore = (user: User): number => {
  if (!user.roster || !user.roster.lineup || !user.weeklyScores) return 0;

  let totalScore = 0;
  for (const playerId of user.roster.lineup) {
    if (!user.weeklyScores[playerId]) continue;
    
    for (const week in user.weeklyScores[playerId]) {
        const scores = user.weeklyScores[playerId][week];
        totalScore += (scores?.race1 || 0) + (scores?.race2 || 0);
    }
  }
  return totalScore;
};

const getPlayerTotalScoreForWeek = (user: User, playerId: string, weekId: string): number => {
    const scores = user.weeklyScores?.[playerId]?.[weekId];
    if (!scores) return 0;
    return (scores.race1 || 0) + (scores.race2 || 0);
};

function NewsFeed() {
    const { allUsers } = useUser();
    const [news, setNews] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (allUsers.length > 0) {
            setLoading(true);
            const randomIndex = Math.floor(Math.random() * newsFeedMessages.length);
            setNews(newsFeedMessages[randomIndex]);
            setLoading(false);
        }
    }, [allUsers]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Newspaper className="w-6 h-6 text-blue-500" />
                    League News
                </CardTitle>
                <CardDescription>The latest scoop from the tracks.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Fetching the latest report...</span>
                    </div>
                ) : (
                    <p className="text-sm whitespace-pre-wrap">{news}</p>
                )}
            </CardContent>
        </Card>
    )
}

export default function DashboardPage() {
  const { user, allUsers, getPlayerById } = useUser();
  const [rankedUsers, setRankedUsers] = useState<(User & {totalScore: number})[]>([]);

  useEffect(() => {
    if (allUsers.length > 0) {
      const usersWithScores = allUsers
        .map(u => ({
            ...u,
            totalScore: calculateTotalScore(u as User),
        }))
        .filter(u => u.roster.lineup.length >=6)
        .sort((a, b) => b.totalScore - a.totalScore);

      setRankedUsers(usersWithScores as (User & {totalScore: number})[]);
    }
  }, [allUsers]);

  if (!user) {
    return <div className="flex h-screen items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }
  
  const lineupPlayers = user.roster.lineup.map(id => getPlayerById(id)).filter(p => p) as Player[];
  const userRank = rankedUsers.findIndex(u => u.id === user.id) + 1;
  const topFiveUsers = rankedUsers.slice(0, 5);
  
  const stats = [
    { title: 'Your Rank', value: userRank > 0 ? `#${userRank}` : 'N/A', icon: <Trophy className="w-5 h-5 text-amber-500" /> },
    { title: 'League Players', value: allUsers.length, icon: <Users className="w-5 h-5 text-blue-500" /> },
    { title: 'Fantasy Coins', value: user.currency.toLocaleString(), icon: <DollarSign className="w-5 h-5 text-green-500" /> },
    { title: 'Players Owned', value: `${user.players.length} / 10`, icon: <Shield className="w-5 h-5 text-red-500" /> },
  ];

  const getRankIndicator = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" />;
    return <span className="font-mono text-sm text-muted-foreground">{rank}</span>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-headline">Welcome, {user.name}!</h1>
        <p className="text-muted-foreground mt-2">Here's a snapshot of your Kart Fantasy League.</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Your Starting Lineup</CardTitle>
                    <CardDescription>
                    {lineupPlayers.length > 0 ? 'This week\'s contenders.' : 'Your lineup is empty. Go to your roster to add players.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {lineupPlayers.length > 0 ? (
                    <div className="space-y-4">
                        {lineupPlayers.map((player, index) => (
                        <div key={player.id} className={`flex items-center justify-between p-3 rounded-lg ${index % 2 === 0 ? 'bg-secondary/50' : ''}`}>
                            <div className="flex items-center gap-4">
                                <PlayerIcon iconName={player.icon} className="w-12 h-12" />
                                <div>
                                    <p className="font-semibold">{player.name}</p>
                                    <p className="text-xs text-muted-foreground">MMR: {player.mmr?.toLocaleString() || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-primary">{getPlayerTotalScoreForWeek(user, player.id, '1')}</p>
                                <p className="text-xs text-muted-foreground">Week 1 Score</p>
                            </div>
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
                    <CardTitle>Top 5 Users</CardTitle>
                    <CardDescription>The current league leaders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                    {topFiveUsers.map((u, index) => (
                        <div key={u.id} className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary">
                                    {getRankIndicator(index + 1)}
                                </div>
                                <Avatar>
                                    <AvatarFallback>{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className={`font-semibold ${u.id === user.id ? 'text-primary' : ''}`}>{u.name}</p>
                                </div>
                            </div>
                             <div className="text-right">
                                <p className="font-bold text-xl text-primary">{u.totalScore.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Total Score</p>
                            </div>
                        </div>
                    ))}
                    </div>
                </CardContent>
            </Card>

        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
             <NewsFeed />
            <Card>
                <CardHeader>
                    <CardTitle>Your Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {stats.map((stat, index) => (
                        <React.Fragment key={stat.title}>
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                {stat.icon}
                                <span className="font-medium">{stat.title}</span>
                                </div>
                                <span className="font-bold text-lg">{stat.value}</span>
                            </div>
                            {index < stats.length - 1 && <Separator />}
                        </React.Fragment>
                    ))}
                </CardContent>
            </Card>

            <Card className="bg-accent text-accent-foreground">
                <CardHeader>
                    <CardTitle>Auction House</CardTitle>
                    <CardDescription className="text-accent-foreground/80">Bid on the next superstar for your team.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button asChild className="w-full bg-background text-foreground hover:bg-background/90">
                        <Link href="/daily-market">
                            Go to Daily Market <ArrowRight className="ml-2" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
