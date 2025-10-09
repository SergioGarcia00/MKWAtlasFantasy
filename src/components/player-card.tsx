
'use client';

import { useState } from 'react';
import type { Player } from '@/lib/types';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, BarChartHorizontal, TrendingUp, Star, Shield, Globe } from 'lucide-react';
import { PlayerIcon } from './icons/player-icon';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface PlayerCardProps {
  player: Player;
}

const StatItem = ({ label, value, isBoolean }: { label: string; value: React.ReactNode; isBoolean?: boolean }) => (
    <div className="flex justify-between items-center text-sm py-1">
      <p className="text-muted-foreground">{label}</p>
      {isBoolean ? (
        <Badge variant={value ? 'default' : 'destructive'} className="text-xs">
          {value ? 'Yes' : 'No'}
        </Badge>
      ) : (
        <p className="font-semibold">{value}</p>
      )}
    </div>
  );


export function PlayerCard({ player }: PlayerCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, allUsers, purchasePlayer } = useUser();

  if (!player) {
    return null;
  }
  
  const isOwnedByCurrentUser = user?.players.some(p => (typeof p === 'string' ? p : p.id) === player.id) ?? false;
  
  const owner = allUsers.find(u => 
    u.players.some(p => (typeof p === 'string' ? p : p.id) === player.id)
  );

  const isOwnedByOtherUser = owner && owner.id !== user?.id;
  const isOwned = isOwnedByCurrentUser || isOwnedByOtherUser;

  const isRosterFull = (user?.players.length ?? 0) >= 10;
  const canAfford = (user?.currency ?? 0) >= player.cost;

  const handlePurchase = () => {
    if (!user) return;
    purchasePlayer(player);
    setIsOpen(false);
  };

  const gameStats1v1 = player.game_stats?.['1v1'];
  const gameStats2v2 = player.game_stats?.['2v2'];

  const purchaseButtonText = () => {
    if (isOwnedByCurrentUser) return 'Owned';
    if (isOwnedByOtherUser) return 'Unavailable';
    if (isRosterFull) return 'Roster Full';
    if (!canAfford) return 'Not Enough Coins'
    return 'Purchase Player';
  }


  return (
    <>
      <Card
        className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-0 flex-grow flex flex-col">
          <div className="relative bg-gradient-to-br from-primary/20 to-secondary p-6 flex items-center justify-center">
            {isOwnedByOtherUser && (
              <Badge variant="destructive" className="absolute top-2 right-2 z-10">
                Owned by: {owner.name}
              </Badge>
            )}
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
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <div className="flex items-start gap-6">
              <div className="bg-gradient-to-br from-primary/20 to-secondary p-4 rounded-lg">
                <PlayerIcon iconName={player.icon} className="w-24 h-24 text-primary" />
              </div>
              <div className="pt-2">
                <DialogTitle className="text-4xl font-bold font-headline mb-1">{player.name}</DialogTitle>
                <DialogDescription>Review the player's stats and decide if they are a good fit for your team.</DialogDescription>
                <div className="flex items-baseline gap-2 mt-3 text-primary">
                  <DollarSign className="w-6 h-6" />
                  <span className="font-bold text-3xl">{player.cost.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground ml-1">cost</span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="grid md:grid-cols-3 gap-6 py-4">
            
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Career Stats</h4>
              <StatItem label="MMR" value={player.mmr?.toLocaleString() || 'N/A'} />
              <StatItem label="Peak MMR" value={player.peak_mmr?.toLocaleString() || 'N/A'} />
              <StatItem label="Rank" value={player.rank ? `#${player.rank}`: 'N/A'} />
              <StatItem label="Events Played" value={player.events_played || 'N/A'} />
              <StatItem label="Country" value={player.country || 'N/A'} />
            </div>
            
            {gameStats1v1 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b pb-2">1v1 Stats</h4>
                <StatItem label="Win Rate" value={gameStats1v1.win_rate} />
                <StatItem label="Events Played" value={gameStats1v1.events_played} />
                <StatItem label="Last 10" value={gameStats1v1.win_loss_last_10} />
                <StatItem label="Gain/Loss (L10)" value={gameStats1v1.gainloss_last_10} />
                <StatItem label="Largest Gain" value={gameStats1v1.largest_gain} />
                <StatItem label="Avg Score" value={gameStats1v1.average_score} />
                {gameStats1v1.average_score_no_sq && <StatItem label="Avg Score (No SQ)" value={gameStats1v1.average_score_no_sq} />}
                {gameStats1v1.partner_average_score && <StatItem label="Partner Avg Score" value={gameStats1v1.partner_average_score} />}
              </div>
            )}
             
            {gameStats2v2 && (
               <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b pb-2">2v2 Stats</h4>
                <StatItem label="Win Rate" value={gameStats2v2.win_rate} />
                <StatItem label="Events Played" value={gameStats2v2.events_played} />
                <StatItem label="Last 10" value={gameStats2v2.win_loss_last_10} />
                <StatItem label="Gain/Loss (L10)" value={gameStats2v2.gainloss_last_10} />
                <StatItem label="Largest Gain" value={gameStats2v2.largest_gain} />
                <StatItem label="Avg Score" value={gameStats2v2.average_score} />
                {gameStats2v2.average_score_no_sq && <StatItem label="Avg Score (No SQ)" value={gameStats2v2.average_score_no_sq} />}
                {gameStats2v2.partner_average_score && <StatItem label="Partner Avg Score" value={gameStats2v2.partner_average_score} />}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={handlePurchase}
              disabled={isOwned || isRosterFull || !canAfford}
            >
              {purchaseButtonText()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

