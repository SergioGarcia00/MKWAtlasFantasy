'use client';

import type { Player } from '@/lib/types';
import { useUser } from '@/context/user-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gavel, Crown, Users } from 'lucide-react';
import { PlayerIcon } from './icons/player-icon';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { DollarSign, BarChartHorizontal, TrendingUp, Star, Shield, Globe, ArrowRightLeft, Gavel as GavelIcon, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { usePathname } from 'next/navigation';

type Bid = { userId: string; userName: string; amount: number };

interface AuctionListItemProps {
  player: Player & { bids?: Bid[] };
  onBid: (player: Player) => void;
}

const Stat = ({ label, value }: { label: string, value: string | number | undefined }) => (
    <div className="text-center">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-bold text-lg">{value || 'N/A'}</p>
    </div>
)

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


export function AuctionListItem({ player, onBid }: AuctionListItemProps) {
  const { user, allUsers, purchasePlayer, buyoutPlayer } = useUser();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const pathname = usePathname();
  const { toast } = useToast();

  if (!player || !user) {
    return null;
  }
  
  const isOwnedByCurrentUser = user.players.some(p => p.id === player.id);
  const owner = allUsers.find(u => u.players.some(p => p.id === player.id));
  const isOwned = !!owner;

  const highestBid = player.bids?.[0];
  const highestBidderIsCurrentUser = highestBid?.userId === user.id;

  const getButton = () => {
    if (isOwned) return <Button disabled className="w-full">Owned</Button>;
    if (highestBidderIsCurrentUser) {
        return <Button disabled variant="outline" className="w-full border-green-500 text-green-500 bg-green-500/10">You are the top bidder</Button>
    };
    return (
      <Button className="w-full" onClick={(e) => { e.stopPropagation(); onBid(player); }}>
        <Gavel className="mr-2 h-4 w-4" />
        Place Bid
      </Button>
    );
  }

  const priceToShow = highestBid?.amount || player.cost;

  const gameStats1v1 = player.game_stats?.['1v1'];
  const gameStats2v2 = player.game_stats?.['2v2'];

  return (
    <>
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer" onClick={() => setIsDetailsOpen(true)}>
        <div className="p-4 bg-gradient-to-tr from-card to-secondary/50">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <PlayerIcon iconName={player.icon} className="w-20 h-20 text-primary" />
                    <div>
                        <h3 className="font-bold text-2xl font-headline">{player.name}</h3>
                        <div className="flex items-baseline gap-2 text-primary">
                           <span className="font-bold text-3xl">{priceToShow.toLocaleString()}</span>
                            <span className="text-sm text-muted-foreground -translate-y-1">
                                {highestBid ? 'Current Bid' : 'Base Cost'}
                            </span>
                        </div>
                    </div>
                </div>
                 <div className="text-right">
                    {owner ? (
                        <Badge variant="secondary">Owned by {owner.name}</Badge>
                    ) : highestBidderIsCurrentUser ? (
                        <Badge variant="default" className="bg-green-600">Top Bidder</Badge>
                    ) : highestBid ? (
                         <Badge variant="destructive">Outbid</Badge>
                    ) : (
                         <Badge variant="outline">No Bids Yet</Badge>
                    )}
                </div>
            </div>
        </div>
        <Separator />
        <div className="p-4 grid grid-cols-3 gap-4 bg-card">
            <Stat label="MMR" value={player.mmr?.toLocaleString()} />
            <Stat label="Rank" value={player.rank ? `#${player.rank}` : 'N/A'} />
            <Stat label="Country" value={player.country} />
        </div>
        <Separator />
         <div className="p-4 bg-secondary/30">
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Users className="text-muted-foreground"/>
                        Bidders ({player.bids?.length || 0})
                    </h4>
                     {player.bids && player.bids.length > 0 ? (
                        <div className="flex -space-x-2">
                             <TooltipProvider>
                                {player.bids.slice(0, 5).map((bid, index) => (
                                    <Tooltip key={bid.userId}>
                                        <TooltipTrigger asChild>
                                            <Avatar className={`w-8 h-8 border-2 ${bid.userId === highestBid?.userId ? 'border-amber-400' : 'border-card'}`}>
                                                <AvatarFallback className="text-xs">{bid.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                {bid.userId === highestBid?.userId && <Crown className="absolute -top-2 -right-2 w-4 h-4 text-amber-400 bg-background rounded-full p-0.5"/>}
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{bid.userName} - {bid.userId === highestBid?.userId ? 'Highest Bidder' : 'Bidder'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                             </TooltipProvider>
                            {player.bids.length > 5 && (
                                 <Avatar className="w-8 h-8 border-2 border-card">
                                    <AvatarFallback className="text-xs">+{player.bids.length - 5}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic">Be the first to bid!</p>
                    )}
                </div>
                <div className="w-40">
                     {getButton()}
                </div>
            </div>
        </div>
    </Card>

    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <div className="flex items-start gap-6">
              <div className="bg-gradient-to-br from-primary/20 to-secondary p-4 rounded-lg">
                <PlayerIcon iconName={player.icon} className="w-24 h-24 text-primary" />
              </div>
              <div className="pt-2">
                <DialogTitle className="text-4xl font-bold font-headline mb-1 flex items-center gap-4">{player.name}
                 {isOwnedByCurrentUser && <Badge variant="default">On your team</Badge>}
                 {owner && !isOwnedByCurrentUser && <Badge variant="destructive">Owned by {owner.name}</Badge>}
                </DialogTitle>
                <DialogDescription>Review the player's stats to see if they're a good fit for your team.</DialogDescription>
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
                <StatItem label="Average Score" value={gameStats1v1.average_score} />
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
                <StatItem label="Average Score" value={gameStats2v2.average_score} />
                {gameStats2v2.average_score_no_sq && <StatItem label="Avg Score (No SQ)" value={gameStats2v2.average_score_no_sq} />}
                {gameStats2v2.partner_average_score && <StatItem label="Partner Avg Score" value={gameStats2v2.partner_average_score} />}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline" onClick={(e) => e.stopPropagation()}>Close</Button>
            </DialogClose>
            {getButton()}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
