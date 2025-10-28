
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Newspaper, MessageSquare, Send, Loader2, Trophy, Users, Star, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PlayerIcon } from '@/components/icons/player-icon';
import { Badge } from '@/components/ui/badge';
import type { Player, User } from '@/lib/types';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';

interface NewsItem {
  id: string;
  timestamp: number;
  messageKey: string;
  params: (string | number)[];
  icon?: string;
}

interface ShoutboxMessage {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  message: string;
}

const calculatePlayerTotalScore = (playerId: string, user: User | null): number => {
    if (!user || !user.weeklyScores || !user.weeklyScores[playerId]) return 0;
    
    const playerScores = user.weeklyScores[playerId];
    return Object.values(playerScores).reduce((total, week) => total + (week.race1 || 0) + (week.race2 || 0), 0);
};

const calculateUserTotalScore = (user: User): number => {
    if (!user.weeklyScores) return 0;
    let totalScore = 0;
    for (const playerId in user.weeklyScores) {
        // Check if the player ID is in the user's lineup for that week's scoring
        // This logic can be improved if weekly lineups are stored.
        // For now, we assume all scores for a user should count.
        const playerScoresByWeek = user.weeklyScores[playerId];
        for (const weekId in playerScoresByWeek) {
            const scores = playerScoresByWeek[weekId];
            totalScore += (scores?.race1 || 0) + (scores?.race2 || 0);
        }
    }
    return totalScore;
};

export default function DashboardPage() {
  const { user, allUsers, getPlayerById } = useUser();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [shoutboxMessages, setShoutboxMessages] = useState<ShoutboxMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [isLoadingShoutbox, setIsLoadingShoutbox] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const fetchNews = useCallback(async () => {
    setIsLoadingNews(true);
    try {
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();
      setNews(data);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Could not load league news.', variant: 'destructive'});
    } finally {
      setIsLoadingNews(false);
    }
  }, [toast]);

  const fetchShoutbox = useCallback(async () => {
    setIsLoadingShoutbox(true);
    try {
      const res = await fetch('/api/shoutbox');
      if (!res.ok) throw new Error('Failed to fetch shoutbox messages');
      const data = await res.json();
      setShoutboxMessages(data);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Could not load shoutbox messages.', variant: 'destructive'});
    } finally {
      setIsLoadingShoutbox(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchNews();
    fetchShoutbox();
  }, [fetchNews, fetchShoutbox]);

  const handlePostMessage = async () => {
    if (!user || !newMessage.trim()) return;
    setIsPosting(true);
    try {
      const res = await fetch('/api/shoutbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          message: newMessage,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to post message');
      }
      setNewMessage('');
      await fetchShoutbox();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsPosting(false);
    }
  };

  const rankedUsers = useMemo(() => {
    return allUsers
      .map(u => ({ ...u, totalScore: calculateUserTotalScore(u) }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [allUsers]);

  const userRank = useMemo(() => {
    if (!user) return null;
    const rank = rankedUsers.findIndex(u => u.id === user.id);
    return rank !== -1 ? rank + 1 : null;
  }, [user, rankedUsers]);
  
  const lineupPlayers = useMemo(() => {
    if (!user) return [];
    return user.roster.lineup
      .map(id => getPlayerById(id))
      .filter((p): p is Player => p !== undefined);
  }, [user, getPlayerById]);

  const formatNewsMessage = (key: string, params: (string | number)[]) => {
    let message = t(key);
    params.forEach((param, index) => {
        message = message.replace(`{${index}}`, String(param));
    });
    return message;
  };

  if (!user) {
    return <div className="flex h-screen items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-orange-600" />;
    return <span className="font-mono text-sm text-muted-foreground">{rank}</span>;
  };


  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">{t('dashboard_title')}</h1>
        <p className="text-muted-foreground mt-2">{t('dashboard_subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card>
            <CardHeader>
                <CardTitle>{t('your_stats')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                    <Trophy className="w-8 h-8 text-primary mb-2" />
                    <p className="text-2xl font-bold">#{userRank || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{t('your_rank')}</p>
                </div>
                 <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                    <Users className="w-8 h-8 text-primary mb-2" />
                    <p className="text-2xl font-bold">{user.players.length} / 10</p>
                    <p className="text-sm text-muted-foreground">{t('players_owned')}</p>
                </div>
                 <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg col-span-2">
                    <DollarSign className="w-8 h-8 text-green-500 mb-2" />
                    <p className="text-2xl font-bold">{user.currency.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{t('fantasy_coins')}</p>
                </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>{t('top_users')}</CardTitle>
                <CardDescription>{t('top_users_subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {rankedUsers.slice(0, 3).map((u, index) => (
                        <div key={u.id} className="flex items-center">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary mr-3">
                               {getRankBadge(index + 1)}
                            </div>
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>{u.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="ml-3 flex-1">
                                <p className="font-semibold text-sm truncate">{u.name}</p>
                                <p className="text-xs text-muted-foreground">{u.totalScore.toLocaleString()} {t('points')}</p>
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href="/rankings/users">{t('view_full_rankings')} <ArrowRight className="ml-2" /></Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Star className="text-primary"/> {t('starting_lineup')}</CardTitle>
            <CardDescription>{t('starting_lineup_subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lineupPlayers.map(player => (
                <div key={player.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                   <div className="flex items-center gap-3">
                      <PlayerIcon iconName={player.icon} className="w-8 h-8" />
                      <p className="font-medium text-sm">{player.name}</p>
                   </div>
                   <Badge variant="secondary" className="font-bold">{calculatePlayerTotalScore(player.id, user).toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Newspaper className="text-primary" />
                {t('league_news')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingNews ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-12 w-full bg-muted rounded-md animate-pulse" />)}
                </div>
              ) : news.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4">
                  {news.map(item => (
                    <div key={item.id} className="flex items-start gap-4">
                       <Avatar>
                          <AvatarFallback>
                            {item.icon ? <span>{item.icon}</span> : <Newspaper className="text-muted-foreground" />}
                          </AvatarFallback>
                       </Avatar>
                      <div className="flex-1">
                        <p className="text-sm" dangerouslySetInnerHTML={{ __html: formatNewsMessage(item.messageKey, item.params) }} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">{t('no_news_yet')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <MessageSquare className="text-primary" />
                {t('shoutbox')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                {isLoadingShoutbox ? (
                     <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-16 w-full bg-muted rounded-md animate-pulse" />)}
                    </div>
                ) : (
                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                    {shoutboxMessages.length > 0 ? shoutboxMessages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-3">
                        <Avatar>
                        <AvatarFallback>{msg.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted p-3 rounded-lg">
                        <div className="flex items-baseline justify-between">
                            <p className="font-semibold text-sm">{msg.userName}</p>
                            <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                            </p>
                        </div>
                        <p className="text-sm mt-1">{msg.message}</p>
                        </div>
                    </div>
                    )) : (
                        <p className="text-muted-foreground text-center py-8">{t('no_shouts_yet')}</p>
                    )}
                </div>
                )}
            </CardContent>
            <CardContent className="border-t pt-4">
               <div className="space-y-2">
                 <Textarea 
                    placeholder={t('shoutbox_placeholder')}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="h-24"
                 />
                 <Button onClick={handlePostMessage} className="w-full" disabled={isPosting}>
                    {isPosting ? <Loader2 className="animate-spin" /> : <Send />}
                    {t('shoutbox_post_button')}
                 </Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    