'use client';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/user-context';
import { Sparkles, Bot } from 'lucide-react';
import { PlayerCard } from '@/components/player-card';
import { Player } from '@/lib/types';
import { useState, useEffect, use } from 'react';
import { getPlayerRecommendations } from '@/ai/flows/recommend-players-flow';
import { Skeleton } from '@/components/ui/skeleton';

export default function WeeklyMarketPage() {
  const { user } = useUser();
  const [recommendations, setRecommendations] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const recommendedPlayers = await getPlayerRecommendations({
        user,
      });
      setRecommendations(recommendedPlayers);
    } catch (error) {
      console.error('Failed to get player recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold font-headline">
            Mercado Semanal de Fichajes
          </h1>
        </div>
        <p className="text-muted-foreground mt-2">
          Recibe recomendaciones de jugadores personalizadas por la IA para
          mejorar tu equipo.
        </p>
      </header>

      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Recomendaciones de la IA para ti
              </h3>
              <p className="text-sm text-muted-foreground">
                Analizamos tu plantilla y presupuesto para sugerirte los mejores
                fichajes.
              </p>
            </div>
          </div>
          <Button onClick={fetchRecommendations} disabled={loading}>
            {loading ? 'Generando...' : 'Regenerar Recomendaciones'}
          </Button>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recommendations.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
