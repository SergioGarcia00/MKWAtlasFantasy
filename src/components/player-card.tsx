'use client';

import { useState } from 'react';
import type { Player, UserPlayer } from '@/lib/types';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { DollarSign, BarChartHorizontal, TrendingUp, Star, Shield, Globe, ArrowRightLeft, Gavel, Loader2, Link as LinkIcon } from 'lucide-react';
import { PlayerIcon } from './icons/player-icon';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { differenceInDays, formatDistanceToNowStrict } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';

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
  
  const { user, allUsers, purchasePlayer, buyoutPlayer } = useUser();
  const pathname = usePathname();
  const isStorePage = pathname === '/store';
  const isBuyoutPage = pathname === '/player-buyout';


  if (!player || !user) {
    return null;
  }
  
  const isOwnedByCurrentUser = user.players.some(p => p.id === player.id);
  
  const ownerInfo = allUsers.map(u => {
    const userPlayer = u.players.find(p => p.id === player.id);
    return userPlayer ? { user: u, purchasedAt: userPlayer.purchasedAt, clauseInvestment: userPlayer.clauseInvestment || 0 } : null;
  }).find(info => info !== null);

  const owner = ownerInfo?.user;
  const isOwnedByOtherUser = owner && owner.id !== user.id;
  const isOwned = isOwnedByCurrentUser || isOwnedByOtherUser;

  const isRosterFull = user.players.length >= 10;
  
  const baseBuyoutPrice = player.cost;
  const totalBuyoutPrice = baseBuyoutPrice + (ownerInfo?.clauseInvestment || 0);
  const canAffordBuyout = user.currency >= totalBuyoutPrice;

  const daysSincePurchase = ownerInfo ? differenceInDays(new Date(), new Date(ownerInfo.purchasedAt)) : 0;
  const isBuyoutProtected = isOwnedByOtherUser && daysSincePurchase < 14;
  const buyoutProtectionDaysLeft = 14 - daysSincePurchase;

  const handlePurchase = () => {
    purchasePlayer(player);
    setIsOpen(false);
  };
  
  const handleBuyout = () => {
    if (!owner) return;
    buyoutPlayer(player, owner);
    setIsOpen(false);
  };
  
  const gameStats1v1 = player.game_stats?.['1v1'];
  const gameStats2v2 = player.game_stats?.['2v2'];

  const getButton = () => {
    if (isStorePage) return null;

    if (isOwnedByCurrentUser) {
      return <Button className="w-full" disabled>Owned by you</Button>;
    }

    if (isOwnedByOtherUser && pathname === '/player-buyout') {
        if (isBuyoutProtected) {
             return (
                <Button 
                    className="w-full bg-gray-400"
                    disabled
                    title={`This player is protected for ${buyoutProtectionDaysLeft} more day(s).`}
                >
                    <Shield className="mr-2 h-4 w-4" />
                    Protected
                </Button>
            )
        }
        return (
            <Button 
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Make Offer
            </Button>
        )
    }

     return (
        <Button
            className="w-full bg-accent hover:bg-accent/90"
            disabled={isOwned || isRosterFull}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
        >
            {isOwned ? 'Owned' : isRosterFull ? 'Roster Full' : 'View Details'}
        </Button>
    )
  }
  
  const priceToShow = isBuyoutPage && isOwnedByOtherUser ? totalBuyoutPrice : player.cost;

  const cardFooter = getButton();

  return (
    <>
      <Card
        className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <CardHeader className="p-4">
          <div className="relative bg-gradient-to-br from-primary/20 to-secondary p-6 flex items-center justify-center rounded-lg">
            {isOwnedByOtherUser && (
              <Badge variant="secondary" className="absolute top-2 right-2 z-10">
                Owned by: {owner.name}
              </Badge>
            )}
            {isOwnedByCurrentUser && (
              <Badge variant="default" className="absolute top-2 right-2 z-10">
                On your team
              </Badge>
            )}
             {isBuyoutProtected && isBuyoutPage && (
              <Badge variant="destructive" className="absolute top-2 left-2 z-10">
                <Shield className="w-3 h-3 mr-1.5"/>
                {buyoutProtectionDaysLeft}d left
              </Badge>
            )}
            <PlayerIcon iconName={player.icon} className="w-24 h-24 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
          <h3 className="font-bold text-lg font-headline">{player.name}</h3>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold">{priceToShow.toLocaleString()}</span>
               {isBuyoutPage && isOwnedByOtherUser && <span className="text-xs">(Buyout)</span>}
            </div>
        </CardContent>
        {cardFooter && (
          <CardFooter className="p-2 bg-secondary">
            {cardFooter}
          </CardFooter>
        )}
      </Card>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <div className="flex items-start gap-6">
              <div className="bg-gradient-to-br from-primary/20 to-secondary p-4 rounded-lg">
                <PlayerIcon iconName={player.icon} className="w-24 h-24 text-primary" />
              </div>
              <div className="pt-2">
                <DialogTitle className="text-4xl font-bold font-headline mb-1 flex items-center gap-4">{player.name}
                 {isOwnedByCurrentUser && <Badge variant="default">On your team</Badge>}
                 {isOwnedByOtherUser && <Badge variant="destructive">Owned by {owner.name}</Badge>}
                </DialogTitle>
                <DialogDescription>Review the player's stats to see if they're a good fit for your team.</DialogDescription>
                 <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-baseline gap-2 text-primary">
                        <DollarSign className="w-6 h-6" />
                        <span className="font-bold text-3xl">{player.cost.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground ml-1">cost</span>
                    </div>
                     {player.registry_url && (
                        <Button asChild variant="outline" size="sm">
                            <Link href={player.registry_url} target="_blank">
                                <LinkIcon className="mr-2 h-4 w-4"/>
                                View on MKCentral Registry
                            </Link>
                        </Button>
                    )}
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
                <Button variant="outline">Close</Button>
            </DialogClose>
            {!isStorePage && !isOwned && (
                 <Button
                    className="bg-accent hover:bg-accent/90"
                    onClick={handlePurchase}
                    disabled={isRosterFull || user.currency < player.cost}
                >
                    {isRosterFull ? 'Roster Full' : user.currency < player.cost ? 'Insufficient Funds' : 'Purchase Player'}
                </Button>
            )}
            {!isStorePage && isOwnedByOtherUser && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                            disabled={isRosterFull || !canAffordBuyout || isBuyoutProtected}
                            title={isBuyoutProtected ? `This player is protected for ${buyoutProtectionDaysLeft} more day(s).` : ''}
                         >
                            <ArrowRightLeft className="mr-2" />
                            {isRosterFull ? 'Roster Full' 
                            : !canAffordBuyout ? 'Cannot afford buyout' 
                            : isBuyoutProtected ? `Protected (${buyoutProtectionDaysLeft}d)`
                            : `Buyout for ${totalBuyoutPrice.toLocaleString()}`}
                         </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Buyout Clause</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will purchase {player.name} from {owner.name} for a price of {totalBuyoutPrice.toLocaleString()} coins.
                            The original owner will be refunded the original purchase cost. This action is irreversible.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBuyout}>Confirm Buyout</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
