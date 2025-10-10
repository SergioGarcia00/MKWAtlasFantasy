'use client';

import { PlayerCard } from '@/components/player-card';
import { ALL_PLAYERS } from '@/data/players';
import { useUser } from '@/context/user-context';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function StorePage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlayers = ALL_PLAYERS.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return <div className="flex h-full items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Explorar Jugadores</h1>
        <p className="text-muted-foreground mt-2">
          Consulta las estadísticas de todos los pilotos de la liga. Los fichajes se realizan en el Mercado Diario.
        </p>
        <div className="mt-4 max-w-sm">
            <Input 
                placeholder="Buscar un jugador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </header>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredPlayers.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
      {filteredPlayers.length === 0 && (
          <div className="text-center col-span-full py-16">
              <p className="text-lg text-muted-foreground">No se han encontrado jugadores para "{searchTerm}".</p>
          </div>
      )}
    </div>
  );
}
