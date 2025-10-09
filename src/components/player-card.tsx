'use client';

import { useState } from 'react';
import type { Player } from '@/lib/types';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, BarChartHorizontal, TrendingUp, Star, Shield, Globe } from 'lucide-react';
import { PlayerIcon } from './icons/player-icon';
import { Badge } from './ui/badge';

interface PlayerCardProps {
  player: Player;
}

export function PlayerCard({ player }: PlayerCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, purchasePlayer } = useUser();

  if (!player) {
    return null;
  }

  const isOwned = user?.players.some(p => p && p.id === player.id) ?? false;
  const isRosterFull = (user?.players.length ?? 0) >= 10;
  const canAfford = (user?.currency ?? 0) >= player.cost;

  const handlePurchase = () => {
    if (!user) return;
    purchasePlayer(player);
    setIsOpen(false);
  };
  
  const additionalStats = [
    { label: 'MMR', value: player.mmr?.toLocaleString(), icon: <Star className="w-4 h-4 text-amber-500" /> },
    { label: 'Peak MMR', value: player.peak_mmr?.toLocaleString(), icon: <TrendingUp className="w-4 h-4 text-red-500" /> },
    { label: 'Rank', value: player.rank ? `#${player.rank}`: 'N/A', icon: <BarChartHorizontal className="w-4 h-4 text-blue-500" /> },
    { label: 'Events Played', value: player.events_played, icon: <Shield className="w-4 h-4 text-green-500" /> },
    { label: 'Country', value: player.country, icon: <Globe className="w-4 h-4 text-purple-500" /> },
  ].filter(stat => stat.value !== undefined && stat.value !== null);

  const gameStats1v1 = player.game_stats?.['1v1'];
  const gameStats2v2 = player.game_stats?.['2v2'];

  return (
    <>
      <Card
        className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-0 flex-grow flex flex-col">
          <div className="bg-gradient-to-br from-primary/20 to-secondary p-6 flex items-center justify-center">
            <PlayerIcon iconName={player.icon} className="w-24 h-24 text-primary" />
          </div>
          <div className="p-4 flex-grow">
            <h3 className="font-bold text-lg font-headline">{player.name}</h3>
            <div className="flex items-center gap-2 mt-2 text-primary">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold">{player.cost.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-2 bg-secondary">
          <Button
            className="w-full bg-accent hover:bg-accent/90"
            disabled={isOwned || isRosterFull || !canAfford}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            {isOwned ? 'Owned' : isRosterFull ? 'Roster Full' : 'View'}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <PlayerIcon iconName={player.icon} className="w-12 h-12 text-primary" />
              <span className="text-2xl font-bold font-headline">{player.name}</span>
            </DialogTitle>
            <DialogDescription>
              Review the player's stats and decide if they are a good fit for your team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg col-span-full">
                    <div className="flex items-center gap-2 font-semibold">
                        <DollarSign className="w-5 h-5 text-primary"/>
                        Cost
                    </div>
                    <span className="font-bold text-lg">{player.cost.toLocaleString()}</span>
                </div>
                {additionalStats.map(stat => (
                  <div key={stat.label} className="p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2 font-medium text-muted-foreground">
                      {stat.icon}
                      <span>{stat.label}</span>
                    </div>
                    <div className="mt-1 text-base font-bold">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {gameStats1v1 && (
                <div>
                  <h4 className="font-semibold mb-2">1v1 Stats</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Badge variant="outline">Win Rate: {gameStats1v1.win_rate}</Badge>
                    <Badge variant="outline">Events: {gameStats1v1.events_played}</Badge>
                    <Badge variant="outline" className="col-span-2">Last 10: {gameStats1v1.win_loss_last_10}</Badge>
                  </div>
                </div>
              )}
               {gameStats2v2 && (
                <div>
                  <h4 className="font-semibold mb-2">2v2 Stats</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Badge variant="outline">Win Rate: {gameStats2v2.win_rate}</Badge>
                    <Badge variant="outline">Events: {gameStats2v2.events_played}</Badge>
                    <Badge variant="outline" className="col-span-2">Last 10: {gameStats2v2.win_loss_last_10}</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={handlePurchase}
              disabled={isOwned || isRosterFull || !canAfford}
            >
              {isOwned ? 'Already Owned' : isRosterFull ? 'Roster Full' : !canAfford ? 'Not Enough Coins' : 'Purchase Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
