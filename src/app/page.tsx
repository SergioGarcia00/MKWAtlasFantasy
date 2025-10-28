'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Newspaper, MessageSquare, Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
  id: string;
  timestamp: number;
  message: string;
  user?: {
    id: string;
    name: string;
  };
}

interface ShoutboxMessage {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  message: string;
}

export default function DashboardPage() {
  const { user, allUsers } = useUser();
  const { toast } = useToast();
  
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

  const getUserById = (id: string) => allUsers.find(u => u.id === id);

  if (!user) {
    return <div className="flex h-screen items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">League Activity</h1>
        <p className="text-muted-foreground mt-2">Catch up on the latest news and what players are talking about.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* News Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Newspaper className="text-primary" />
                League News
              </CardTitle>
              <CardDescription>The latest transactions and events from around the league.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingNews ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-12 w-full bg-muted rounded-md animate-pulse" />)}
                </div>
              ) : news.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                  {news.map(item => (
                    <div key={item.id} className="flex items-start gap-4">
                       <Avatar>
                          <AvatarFallback>
                            <Newspaper className="text-muted-foreground" />
                          </AvatarFallback>
                       </Avatar>
                      <div className="flex-1">
                        <p className="text-sm" dangerouslySetInnerHTML={{ __html: item.message }} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No news yet. Let the games begin!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Shoutbox */}
        <div className="lg:col-span-1">
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <MessageSquare className="text-primary" />
                Shoutbox
              </CardTitle>
              <CardDescription>Share your thoughts with the league.</CardDescription>
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
                        <p className="text-muted-foreground text-center py-8">Be the first to say something!</p>
                    )}
                </div>
                )}
            </CardContent>
            <CardContent className="border-t pt-4">
               <div className="space-y-2">
                 <Textarea 
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="h-24"
                 />
                 <Button onClick={handlePostMessage} className="w-full" disabled={isPosting}>
                    {isPosting ? <Loader2 className="animate-spin" /> : <Send />}
                    Post Message
                 </Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
