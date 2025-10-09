'use client';

import { useState } from 'react';
import type { Player } from '@/lib/types';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, BarChart2 } from 'lucide-react';
import { PlayerIcon } from './icons/player-icon';
import { Badge } from './ui/badge';

interface PlayerCardProps {
  player: Player;
}

const statColors: Record<string, string> = {
    speed: 'bg-red-500',
    acceleration: 'bg-yellow-500',
    weight: 'bg-blue-500',
    handling: 'bg-green-500',
    traction: 'bg-purple-500',
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
    purchasePlayer(player);
    setIsOpen(false);
  };

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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <PlayerIcon iconName={player.icon} className="w-12 h-12 text-primary" />
              <span className="text-2xl font-bold font-headline">{player.name}</span>
            </DialogTitle>
            <DialogDescription>
              Review the player's stats and decide if they are a good fit for your team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-2 font-semibold">
                    <DollarSign className="w-5 h-5 text-primary"/>
                    Cost
                </div>
                <span className="font-bold text-lg">{player.cost.toLocaleString()}</span>
            </div>
            
            <div className="space-y-3">
              {Object.entries(player.stats).map(([stat, value]) => (
                <div key={stat} className="grid grid-cols-5 items-center gap-2">
                  <span className="text-sm font-medium capitalize col-span-2">{stat}</span>
                  <div className="col-span-3 h-4 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${statColors[stat]}`} style={{ width: `${value * 10}%` }} />
                  </div>
                </div>
              ))}
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
