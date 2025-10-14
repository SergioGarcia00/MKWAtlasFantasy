
'use client';

import type { Player } from '@/lib/types';
import { useUser } from '@/context/user-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { DollarSign, Gavel, UserCheck, Crown } from 'lucide-react';
import { PlayerIcon } from './icons/player-icon';
import { Badge } from './ui/badge';

type Bid = { userId: string; userName: string; amount: number };

interface AuctionListItemProps {
  player: Player & { bids?: Bid[] };
  onBid: (player: Player) => void;
}

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
        return <Button disabled variant="outline" className="w-full border-green-500 text-green-500">You are the top bidder</Button>
    };
    return (
      <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={(e) => { e.stopPropagation(); onBid(player); }}>
        <Gavel className="mr-2 h-4 w-4" />
        Bid
      </Button>
    );
  }

  const priceToShow = highestBid?.amount || player.cost;

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col md:flex-row">
      <CardContent className="p-6 flex-grow grid md:grid-cols-3 gap-6">
        {/* Player Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <PlayerIcon iconName={player.icon} className="w-24 h-24 text-primary" />
            {owner && (
              <Badge variant="secondary" className="absolute -bottom-2 -right-2">
                Owned by: {owner.name}
              </Badge>
            )}
          </div>
          <div>
            <h3 className="font-bold text-xl font-headline">{player.name}</h3>
            <div className="flex items-center gap-2 mt-2 text-primary">
              <DollarSign className="w-5 h-5" />
              <span className="font-semibold text-xl">{priceToShow.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">
                {highestBid ? 'Current Bid' : 'Base Cost'}
            </p>
          </div>
        </div>

        {/* Bidders List */}
        <div className="md:col-span-2">
            <h4 className="font-semibold mb-2">Top Bidders</h4>
            <div className="border rounded-lg">
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[50px]">Rank</TableHead>
                        <TableHead>User</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {player.bids && player.bids.length > 0 ? (
                            player.bids.slice(0, 5).map((bid, index) => (
                                <TableRow key={bid.userId} className={bid.userId === user.id ? 'bg-blue-500/10' : ''}>
                                    <TableCell className="font-medium text-center">
                                        {index === 0 ? <Crown className="w-5 h-5 text-amber-400 mx-auto" /> : index + 1}
                                    </TableCell>
                                    <TableCell>{bid.userName}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                No bids for this player yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
      </CardContent>
      <div className="p-4 bg-secondary/50 md:border-l md:flex md:items-center md:justify-center md:w-48">
          {getButton()}
      </div>
    </Card>
  );
}
