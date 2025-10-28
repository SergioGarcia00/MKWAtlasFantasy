'use client';

import type { Player } from '@/lib/types';
import { useUser } from '@/context/user-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gavel, Crown, Users, Link as LinkIcon, Gem } from 'lucide-react';
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
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Bid = { userId: string; userName: string; amount: number };

interface AuctionListItemProps {
  player: Player & { bids?: Bid[] };
  onBid: (player: Player) => void;
  isJuicy?: boolean;
  juicyReason?: string;
}

const Stat = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | undefined }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {icon}
            <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="font-semibold">{value || 'N/A'}</span>
        </div>
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


export function AuctionListItem({ player, onBid, isJuicy, juicyReason }: AuctionListItemProps) {
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

  const currentUserHasBid = (player.bids || []).some(bid => bid.userId === user.id);


  const getButton = () => {
    if (isOwned) return <Button disabled className="w-full">Owned</Button>;
    
    return (
      <Button className="w-full" onClick={(e) => { e.stopPropagation(); onBid(player); }}>
        <Gavel className="mr-2 h-4 w-4" />
        Place Bid
      </Button>
    );
  }

  const priceToShow = player.cost;
  const bidsCount = player.bids?.length || 0;


  const gameStats1v1 = player.game_stats?.['1v1'];
  const gameStats2v2 = player.game_stats?.['2v2'];

  return (
    <>
    <Card className={cn("overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer", isJuicy && "ring-2 ring-amber-400 shadow-amber-500/20 shadow-lg")} onClick={() => setIsDetailsOpen(true)}>
        <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Left side: Player info */}
            <div className="md:col-span-2 p-4 bg-gradient-to-r from-card to-secondary/30 flex items-center gap-6 relative">
                {isJuicy && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge className="absolute top-2 left-2 bg-amber-400 text-amber-900 font-bold hover:bg-amber-400">
                                    <Gem className="mr-2"/>
                                    Juicy Find!
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{juicyReason}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                <div className="relative">
                    <PlayerIcon iconName={player.icon} className="w-24 h-24 text-primary drop-shadow-lg" />
                     {owner ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Avatar className="absolute -bottom-2 -right-2 w-8 h-8 border-2 border-background">
                                        <AvatarFallback className="text-xs">{owner.name.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>Owned by {owner.name}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : currentUserHasBid ? (
                         <Badge variant="default" className="absolute -bottom-2 right-0 bg-green-600">Bid Placed</Badge>
                    ) : null}
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-2xl font-headline">{player.name}</h3>
                    <div className="flex items-baseline gap-2 text-primary mt-1">
                        <DollarSign className="w-5 h-5"/>
                        <span className="font-bold text-3xl">{priceToShow.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground -translate-y-1">
                           Base Cost
                        </span>
                    </div>
                     {player.registry_url && (
                        <Button asChild variant="outline" size="sm" className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <Link href={player.registry_url} target="_blank">
                                <LinkIcon className="mr-2 h-4 w-4"/>
                                View Profile on MKCentral
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
            {/* Right side: Stats & Bids */}
            <div className="md:col-span-1 p-4 flex flex-col justify-between bg-secondary/50 md:bg-secondary/80">
                 <div className="space-y-2 mb-4">
                     <Stat icon={<TrendingUp/>} label="MMR" value={player.mmr?.toLocaleString()} />
                     <Stat icon={<BarChartHorizontal/>} label="Rank" value={player.rank ? `#${player.rank}` : 'N/A'} />
                     <Stat icon={<Globe/>} label="Country" value={player.country} />
                </div>
                <Separator className="my-2"/>
                 <div className="flex justify-between items-center pt-2">
                    <div className="flex flex-col">
                        <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                            <Users className="text-muted-foreground"/>
                            Bidders ({bidsCount})
                        </h4>
                        {player.bids && player.bids.length > 0 ? (
                            <div className="flex -space-x-2">
                                <TooltipProvider>
                                    {player.bids.slice(0, 5).map((bid, index) => (
                                        <Tooltip key={bid.userId}>
                                            <TooltipTrigger asChild>
                                                <Avatar className={`w-8 h-8 border-2 border-background`}>
                                                    <AvatarFallback className="text-xs">{bid.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{bid.userName} has placed a bid</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </TooltipProvider>
                                {player.bids.length > 5 && (
                                    <Avatar className="w-8 h-8 border-2 border-background">
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
                 <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-baseline gap-2 text-primary">
                        <DollarSign className="w-6 h-6" />
                        <span className="font-bold text-3xl">{player.cost.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground ml-1">cost</span>
                    </div>
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
