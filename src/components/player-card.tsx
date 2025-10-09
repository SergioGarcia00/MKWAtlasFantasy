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

const StatItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-center text-sm">
    <p className="text-muted-foreground">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);


export function PlayerCard({ player }: PlayerCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, purchasePlayer } = useUser();

  if (!player) {
    return null;
  }

  const isOwned = user?.players.some(p => p.id === player.id) ?? false;
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
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-primary/20 to-secondary p-2 rounded-lg">
                <PlayerIcon iconName={player.icon} className="w-16 h-16 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold font-headline">{player.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1 text-primary">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-bold text-xl">{player.cost.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground ml-1">cost</span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="grid md:grid-cols-3 gap-6 py-4">
            {/* General Stats */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Career Stats</h4>
              <Card className="bg-secondary/50">
                <CardContent className="p-4 space-y-2">
                  <StatItem label="MMR" value={player.mmr?.toLocaleString() || 'N/A'} />
                  <StatItem label="Peak MMR" value={player.peak_mmr?.toLocaleString() || 'N/A'} />
                  <StatItem label="Rank" value={player.rank ? `#${player.rank}`: 'N/A'} />
                  <StatItem label="Events Played" value={player.events_played || 'N/A'} />
                  <StatItem label="Country" value={player.country || 'N/A'} />
                </CardContent>
              </Card>
            </div>
            
            {/* 1v1 Stats */}
            {gameStats1v1 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">1v1 Stats</h4>
                <Card className="bg-secondary/50">
                  <CardContent className="p-4 space-y-2">
                    <StatItem label="Win Rate" value={gameStats1v1.win_rate} />
                    <StatItem label="Events Played" value={gameStats1v1.events_played} />
                    <StatItem label="Last 10" value={gameStats1v1.win_loss_last_10} />
                    <StatItem label="Gain/Loss (L10)" value={gameStats1v1.gainloss_last_10} />
                    <StatItem label="Largest Gain" value={gameStats1v1.largest_gain} />
                    <StatItem label="Avg Score" value={gameStats1v1.average_score} />
                    {gameStats1v1.average_score_no_sq && <StatItem label="Avg Score (No SQ)" value={gameStats1v1.average_score_no_sq} />}
                    {gameStats1v1.partner_average_score && <StatItem label="Partner Avg Score" value={gameStats1v1.partner_average_score} />}
                  </CardContent>
                </Card>
              </div>
            )}
             
            {/* 2v2 Stats */}
            {gameStats2v2 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">2v2 Stats</h4>
                <Card className="bg-secondary/50">
                  <CardContent className="p-4 space-y-2">
                    <StatItem label="Win Rate" value={gameStats2v2.win_rate} />
                    <StatItem label="Events Played" value={gameStats2v2.events_played} />
                    <StatItem label="Last 10" value={gameStats2v2.win_loss_last_10} />
                    <StatItem label="Gain/Loss (L10)" value={gameStats2v2.gainloss_last_10} />
                    <StatItem label="Largest Gain" value={gameStats2v2.largest_gain} />
                    <StatItem label="Avg Score" value={gameStats2v2.average_score} />
                     {gameStats2v2.average_score_no_sq && <StatItem label="Avg Score (No SQ)" value={gameStats2v2.average_score_no_sq} />}
                    {gameStats2v2.partner_average_score && <StatItem label="Partner Avg Score" value={gameStats2v2.partner_average_score} />}
                  </CardContent>
                </Card>
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
              {isOwned ? 'Already Owned' : isRosterFull ? 'Roster Full' : !canAfford ? 'Not Enough Coins' : 'Purchase Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
