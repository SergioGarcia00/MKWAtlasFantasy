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

export function AuctionListItem({ player, onBid }: AuctionListItemProps) {
  const { user, allUsers } = useUser();

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

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
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
                                        <TooltipTrigger>
                                            <Avatar className={`w-8 h-8 border-2 ${bid.userId === user.id ? 'border-primary' : 'border-card'}`}>
                                                <AvatarFallback className="text-xs">{bid.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{bid.userName} - {bid.amount.toLocaleString()}</p>
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
  );
}