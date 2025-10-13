'use client';

import { ShopPlayerCard } from '@/components/shop-player-card';
import { useUser } from '@/context/user-context';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useEffect } from 'react';
import type { Player } from '@/lib/types';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

export default function PlayerShopPage() {
  const { user, allPlayers } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (user && user.id !== 'user-sipgb') {
      router.push('/');
    }
  }, [user, router]);

  const filteredPlayers = useMemo(() => {
    if (!allPlayers) return [];
    return allPlayers.filter(player =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allPlayers, searchTerm]);


  if (!user || user.id !== 'user-sipgb') {
    return <div className="flex h-full items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Player Shop</h1>
        <p className="text-muted-foreground mt-2">
          Purchase any player in the league for a fixed price based on their Peak MMR.
        </p>
        <div className="mt-4 max-w-sm">
            <Input 
                placeholder="Search for a player..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </header>
      
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredPlayers.map(player => (
              <ShopPlayerCard key={player.id} player={player} />
            ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
             <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Players Found</AlertTitle>
                <AlertDescription>
                   {searchTerm ? `No players found for "${searchTerm}".` : 'No players available in the shop.'}
                </AlertDescription>
            </Alert>
        </div>
      )}
    </div>
  );
}
