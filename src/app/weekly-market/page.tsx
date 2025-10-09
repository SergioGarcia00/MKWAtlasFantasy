'use client';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/user-context';
import { Sparkles, Bot } from 'lucide-react';
import { PlayerCard } from '@/components/player-card';
import { Player } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ALL_PLAYERS } from '@/data/players';

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default function WeeklyMarketPage() {
  const { user, allUsers } = useUser();
  const [recommendations, setRecommendations] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(() => {
    if (!user) return;
    setLoading(true);

    const ownedPlayerIds = new Set(
      allUsers.flatMap(u => u.players.map(p => (typeof p === 'string' ? p : p.id)))
    );

    const availablePlayers = ALL_PLAYERS.filter(p => !ownedPlayerIds.has(p.id));

    const top200 = availablePlayers.filter(p => p.rank && p.rank >= 1 && p.rank <= 200);
    const midTier = availablePlayers.filter(p => p.rank && p.rank > 200 && p.rank <= 500);
    const rest = availablePlayers.filter(p => !p.rank || p.rank > 500);

    const shuffledTop200 = shuffleArray(top200).slice(0, 3);
    const shuffledMidTier = shuffleArray(midTier).slice(0, 3);
    const shuffledRest = shuffleArray(rest).slice(0, 3);

    const finalRecommendations = shuffleArray([
        ...shuffledTop200,
        ...shuffledMidTier,
        ...shuffledRest
    ]);
    
    setRecommendations(finalRecommendations);
    setLoading(false);
  }, [user, allUsers]);

  useEffect(() => {
    if(user && allUsers.length > 0) {
      fetchRecommendations();
    }
  }, [user, allUsers, fetchRecommendations]);

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
          Descubre nuevos talentos para tu equipo con estas recomendaciones aleatorias.
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
                Fichajes Recomendados de la Semana
              </h3>
              <p className="text-sm text-muted-foreground">
                Una selección aleatoria de jugadores de distintos niveles para reforzar tu plantilla.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
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
