'use client';

import { PlayerCard } from '@/components/player-card';
import { useUser } from '@/context/user-context';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import type { Player } from '@/lib/types';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function PlayerMarketPage() {
  const { user, allUsers, getPlayerById } = useUser();
  const [searchTerm, setSearchTerm] = useState('');

  const ownedPlayers = useMemo(() => {
    if (!allUsers) return [];
    
    const allOwnedPlayerIds = allUsers.flatMap(u => u.players.map(p => p.id));
    const uniquePlayerIds = [...new Set(allOwnedPlayerIds)];
    const uniquePlayers = uniquePlayerIds.map(id => getPlayerById(id)).filter(Boolean) as Player[];

    return uniquePlayers.filter(player =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm, getPlayerById]);


  if (!user) {
    return <div className="flex h-full items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Mercado de Fichajes</h1>
        <p className="text-muted-foreground mt-2">
          Explora todos los jugadores que ya han sido fichados por los usuarios de la liga.
        </p>
        <div className="mt-4 max-w-sm">
            <Input 
                placeholder="Buscar un jugador fichado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </header>
      
      {ownedPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {ownedPlayers.map(player => (
            <PlayerCard key={player.id} player={player} />
            ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
             <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No se encontraron jugadores</AlertTitle>
                <AlertDescription>
                   {searchTerm ? `No se encontraron jugadores para "${searchTerm}".` : 'Aún no se han fichado jugadores en la liga.'}
                </AlertDescription>
            </Alert>
        </div>
      )}
    </div>
  );
}
