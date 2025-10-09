'use client';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/user-context';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { PlayerCard } from '@/components/player-card';
import { Player } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ALL_PLAYERS } from '@/data/players';
import { useToast } from '@/hooks/use-toast';

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default function DailyMarketPage() {
  const { user, allUsers } = useUser();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocking, setIsLocking] = useState(false);

  const fetchRecommendations = useCallback(() => {
    if (!user) return;
    setLoading(true);

    const allOwnedPlayerIds = new Set(
        allUsers.flatMap(u => u.players.map(p => p.id))
    );

    const availablePlayers = ALL_PLAYERS.filter(p => !allOwnedPlayerIds.has(p.id) && !p.auction);

    const finalRecommendations = new Set<Player>();

    // This is a temporary way to get some players for auction.
    // In a real scenario, this would be driven by a daily cron job.
    addPlayersToSet(availablePlayers, 10);

    function addPlayersToSet(players: Player[], count: number) {
        const shuffled = shuffleArray(players);
        for(let i=0; i < shuffled.length && finalRecommendations.size < count; i++) {
            if (!finalRecommendations.has(shuffled[i])) {
                finalRecommendations.add(shuffled[i]);
            }
        }
    }
    
    setRecommendations(Array.from(finalRecommendations));
    setLoading(false);
  }, [user, allUsers]);

  useEffect(() => {
    if(user && allUsers.length > 0) {
      fetchRecommendations();
    }
  }, [allUsers, fetchRecommendations]); // Removed user from dependencies

  const handleLockIn = async () => {
    setIsLocking(true);
    try {
        const response = await fetch('/api/auctions/lock-in', { method: 'POST' });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to lock in auctions');
        }
        const result = await response.json();
        toast({
            title: 'Subastas Cerradas!',
            description: `${result.winners.length} jugadores han sido transferidos a sus nuevos dueños.`,
        });
        // Force a full reload to reflect all changes
        window.location.reload();
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error al cerrar subastas',
            description: error.message,
        });
    } finally {
        setIsLocking(false);
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
            <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold font-headline">
                Mercado Diario de Subastas
            </h1>
            </div>
            <p className="text-muted-foreground mt-2">
            ¡Puja por nuevos talentos! Las subastas duran 24 horas.
            </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchRecommendations} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerar Mercado
          </Button>
          {user?.id === 'user-sipgb' && (
              <Button onClick={handleLockIn} disabled={isLocking}>
                  {isLocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cerrar Subastas
              </Button>
          )}
        </div>
      </header>

      <div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {recommendations.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
