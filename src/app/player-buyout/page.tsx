'use client';

import { PlayerCard } from '@/components/player-card';
import { useUser } from '@/context/user-context';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import type { Player } from '@/lib/types';
import { Handshake } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function PlayerBuyoutPage() {
  const { user, allUsers, allPlayers } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();

  const ownedByOthers = useMemo(() => {
    if (!user || allUsers.length === 0) return [];
    
    const allOwnedPlayerIds = new Set(
      allUsers.flatMap(u => u.id !== user.id ? u.players.map(p => p.id) : [])
    );

    return allPlayers
      .filter(p => allOwnedPlayerIds.has(p.id))
      .filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a,b) => b.cost - a.cost);

  }, [user, allUsers, allPlayers, searchTerm]);
  
  if (!user) {
    return <div className="flex h-full items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">{t('playerBuyout')}</h1>
        <p className="text-muted-foreground mt-2">
          Acquire players from other users by activating their buyout clause.
        </p>
        <div className="mt-4 max-w-sm">
            <Input 
                placeholder="Search for a player..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </header>
      
      {ownedByOthers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {ownedByOthers.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      ) : (
         <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <Handshake className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">The Market is Quiet</h3>
          <p className="mt-1 text-sm text-muted-foreground">There are currently no players owned by other users.</p>
        </div>
      )}
    </div>
  );
}
