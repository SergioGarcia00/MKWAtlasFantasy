'use client';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/user-context';
import { Sparkles, Loader2, RefreshCw, Gavel } from 'lucide-react';
import { AuctionListItem } from '@/components/auction-list-item';
import { Player } from '@/lib/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';


export type Bid = { userId: string; userName: string; amount: number };

export default function DailyMarketPage() {
  const { user, allUsers, switchUser, getPlayerById, loadAllData } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const marketQuery = useMemo(() => query(collection(firestore, 'market')), [firestore]);
  const { data: marketPlayers, isLoading: loading } = useCollection<Player>(marketQuery);
  
  const [isLocking, setIsLocking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isBidding, setIsBidding] = useState(false);
  const [biddingPlayer, setBiddingPlayer] = useState<Player | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [isBidLoading, setIsBidLoading] = useState(false);

  const allBidsByPlayer = useMemo(() => {
    return (allUsers || []).reduce<Record<string, Bid[]>>((acc, u) => {
        Object.entries(u.bids || {}).forEach(([playerId, amount]) => {
            if (!acc[playerId]) {
                acc[playerId] = [];
            }
            acc[playerId].push({ amount, userId: u.id, userName: u.name });
        });
        return acc;
    }, {});
  }, [allUsers]);

  const marketPlayersWithBids = useMemo(() => {
    if (!marketPlayers) return [];
    return marketPlayers.map(player => {
        const bids = allBidsByPlayer[player.id] || [];
        const sortedBids = bids.sort((a, b) => b.amount - a.amount);
        const fullPlayer = getPlayerById(player.id);
        return {
            ...(fullPlayer || player),
            bids: sortedBids,
        };
    }).sort((a, b) => (b.bids?.length || 0) - (a.bids?.length || 0));
  }, [marketPlayers, allBidsByPlayer, getPlayerById]);
  

  const handleRefreshMarket = async () => {
    setIsRefreshing(true);
    try {
        const response = await fetch('/api/market/refresh', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to refresh market');
        toast({ title: 'Market Refreshed!', description: 'A new selection of players is up for auction.' });
        // Data will refresh automatically via useCollection
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error refreshing', description: error.message });
    } finally {
        setIsRefreshing(false);
    }
  };

  const handleLockIn = async () => {
    setIsLocking(true);
    try {
        const response = await fetch('/api/auctions/lock-in', { method: 'POST' });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to lock in auctions');
        }
        const result = await response.json();
        toast({
            title: 'Auctions Locked In!',
            description: `${result.winners.length} players have been transferred to their new owners.`,
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error locking in auctions',
            description: error.message,
        });
    } finally {
        setIsLocking(false);
    }
  };

  const handleBidClick = (player: Player) => {
    const highestBid = player.bids?.[0]?.amount || 0;
    const nextBidAmount = highestBid > 0 ? highestBid + 1 : player.cost;
    setBidAmount(nextBidAmount);
    setBiddingPlayer(player);
    setIsBidding(true);
  };

  const handlePlaceBid = async () => {
    if (!biddingPlayer || !user) return;
    setIsBidLoading(true);
    try {
        const response = await fetch(`/api/players/${biddingPlayer.id}/bid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, bidAmount }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to place bid');
        }
        toast({
            title: 'Bid Placed!',
            description: `You have bid ${bidAmount.toLocaleString()} for ${biddingPlayer.name}.`,
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error placing bid',
            description: error.message,
        });
    } finally {
        setIsBidLoading(false);
        setIsBidding(false);
        setBiddingPlayer(null);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
            <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold font-headline">
                Daily Auction Market
            </h1>
            </div>
            <p className="text-muted-foreground mt-2">
            Bid on new talent! Auctions last for 24 hours.
            </p>
        </div>
         <div className="flex items-center gap-2">
            <Button onClick={handleRefreshMarket} variant="outline" disabled={loading || isRefreshing}>
                {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Regenerate Market
            </Button>
            {user?.id === 'user-sipgb' && (
                <Button onClick={handleLockIn} disabled={isLocking}>
                    {isLocking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gavel className="mr-2 h-4 w-4" />}
                    Lock In Auctions
                </Button>
            )}
        </div>
      </header>

      <div>
        {loading ? (
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {marketPlayersWithBids.length > 0 ? marketPlayersWithBids.map((player) => (
              <AuctionListItem key={player.id} player={player} onBid={handleBidClick} />
            )) : (
              <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <p className="text-lg text-muted-foreground">The market is empty. Click "Regenerate Market" to get started!</p>
              </div>
            )}
          </div>
        )}
      </div>

       {biddingPlayer && (
        <Dialog open={isBidding} onOpenChange={setIsBidding}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Place a bid for {biddingPlayer.name}</DialogTitle>
                <DialogDescription>
                {biddingPlayer.bids?.[0]
                    ? `The current highest bid is ${biddingPlayer.bids[0].amount.toLocaleString()}. Your bid must be higher.`
                    : `The base cost is ${biddingPlayer.cost.toLocaleString()}. The highest bid at the end of the auction wins the player.`
                }
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <div className="flex items-center gap-2">
                <Input 
                    id="bidAmount"
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    min={biddingPlayer.bids?.[0] ? biddingPlayer.bids[0].amount + 1 : biddingPlayer.cost}
                />
                <span className="text-muted-foreground">coins</span>
                </div>
                {user && <p className="text-xs text-muted-foreground mt-2">
                    Your balance: {user.currency.toLocaleString()} coins.
                </p>}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handlePlaceBid} disabled={isBidLoading || bidAmount <= (biddingPlayer.bids?.[0]?.amount || biddingPlayer.cost -1)}>
                    {isBidLoading ? <Loader2 className="animate-spin" /> : `Bid ${bidAmount.toLocaleString()}`}
                </Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
