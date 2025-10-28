'use client';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/user-context';
import { Sparkles, Loader2, RefreshCw, Gavel, Clock, Gem } from 'lucide-react';
import { AuctionListItem } from '@/components/auction-list-item';
import { Player, Bid } from '@/lib/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { findJuiciestPlayer, JuiciestPlayerOutput } from '@/ai/flows/find-juiciest-player-flow';

type MarketPlayer = Player & { bids?: Bid[] };

const getTargetTime = () => {
    const nowInStockholm = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));
    const target = new Date(nowInStockholm);
    const isSunday = nowInStockholm.getDay() === 0;
    const resetHour = isSunday ? 19 : 20;

    target.setHours(resetHour, 0, 0, 0);

    if (nowInStockholm.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 1);
        const tomorrowIsSunday = target.getDay() === 0;
        const tomorrowResetHour = tomorrowIsSunday ? 19 : 20;
        target.setHours(tomorrowResetHour, 0, 0, 0);
    }
    return target;
};


const CountdownClock = ({ onTimerEnd }: { onTimerEnd: () => void }) => {
    const [targetTime, setTargetTime] = useState(getTargetTime());
    const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
    const isSunday = useMemo(() => new Date(targetTime.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' })).getDay() === 0, [targetTime]);
    const resetTime = isSunday ? '19:00' : '20:00';

    useEffect(() => {
        const timerId = setInterval(() => {
            const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));
            const difference = targetTime.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
                onTimerEnd();
                setTargetTime(getTargetTime()); // Reset for the next day
            } else {
                const hours = Math.floor((difference / (1000 * 60 * 60)));
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                setTimeLeft({
                    hours: hours.toString().padStart(2, '0'),
                    minutes: minutes.toString().padStart(2, '0'),
                    seconds: seconds.toString().padStart(2, '0'),
                });
            }
        }, 1000);

        return () => clearInterval(timerId);
    }, [targetTime, onTimerEnd]);

    return (
        <div className="text-center bg-card border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
                <Clock className="w-4 h-4" />
                <span>Next Market Refresh</span>
            </div>
            <div className="font-mono text-4xl font-bold text-primary tracking-tight">
                <span>{timeLeft.hours}</span>:
                <span>{timeLeft.minutes}</span>:
                <span>{timeLeft.seconds}</span>
            </div>
             <div className="text-xs text-muted-foreground mt-2">
               Resets at {resetTime} CEST (Sun: 19:00, Mon-Sat: 20:00)
            </div>
        </div>
    );
};

export default function DailyMarketPage() {
  const { user, switchUser, getPlayerById, loadAllData } = useUser();
  const [marketPlayers, setMarketPlayers] = useState<MarketPlayer[]>([]);
  const [isMarketLoading, setIsMarketLoading] = useState(true);
  const [isLocking, setIsLocking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);
  const [biddingPlayer, setBiddingPlayer] = useState<Player | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [isFindingJuicy, setIsFindingJuicy] = useState(false);
  const [juicyPlayer, setJuicyPlayer] = useState<JuiciestPlayerOutput | null>(null);
  const { toast } = useToast();
  
  const fetchMarket = useCallback(async () => {
    setIsMarketLoading(true);
    try {
        const res = await fetch('/api/market');
        if (!res.ok) throw new Error('Failed to fetch market');
        const data = await res.json();
        const playersWithFullData = data.map((mp: MarketPlayer) => {
            const fullPlayer = getPlayerById(mp.id);
            return {
                ...(fullPlayer || {}), // Spread full player data if found
                ...mp, // Spread market player data, overwriting if needed
            }
        }).sort((a: MarketPlayer, b: MarketPlayer) => (b.bids?.length || 0) - (a.bids?.length || 0));
        setMarketPlayers(playersWithFullData);
    } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Could not load market data.', variant: 'destructive'});
    } finally {
        setIsMarketLoading(false);
    }
  }, [getPlayerById, toast]);

  useEffect(() => {
    fetchMarket();
  }, [fetchMarket]);

  const handleRefreshMarket = useCallback(async () => {
    setIsRefreshing(true);
    setJuicyPlayer(null); // Reset juicy find on refresh
    try {
      const response = await fetch('/api/market/refresh', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to refresh market');
      }
      await fetchMarket();
      toast({ title: 'Market Refreshed', description: 'New players are available for auction.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Could not refresh market.', variant: 'destructive' });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchMarket, toast]);

  const handleLockIn = useCallback(async () => {
    setIsLocking(true);
    try {
      const response = await fetch('/api/auctions/lock-in', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to lock in auctions');
      }
      toast({ title: 'Auctions Locked In!', description: result.message });
      await loadAllData();
      await fetchMarket();
    } catch (error: any) {
      toast({ title: 'Error Locking In', description: error.message, variant: 'destructive' });
    } finally {
      setIsLocking(false);
    }
  }, [loadAllData, toast, fetchMarket]);

  const runAutomatedTasks = useCallback(async () => {
        if (user?.id !== 'user-sipgb') return;

        try {
            await handleLockIn();
            await handleRefreshMarket();
            toast({ title: 'Automated Market Update', description: 'Auctions locked and market refreshed successfully.' });
        } catch (error) {
             toast({ title: 'Automated Update Failed', description: 'There was an error during the automated market update.', variant: 'destructive' });
        }
    }, [user, handleLockIn, handleRefreshMarket, toast]);


  const handleBidClick = (player: Player) => {
    setBidAmount(player.cost);
    setBiddingPlayer(player);
    setIsBidDialogOpen(true);
  };

  const handleFindJuiciest = async () => {
    setIsFindingJuicy(true);
    setJuicyPlayer(null);
    try {
        const result = await findJuiciestPlayer({ players: marketPlayers });
        setJuicyPlayer(result);
        toast({
            title: "Juicy Find!",
            description: `The AI recommends ${result.name} as the best value pick!`
        });
    } catch (error) {
        console.error(error);
        toast({ title: 'AI Error', description: 'Could not find the juiciest player.', variant: 'destructive'});
    } finally {
        setIsFindingJuicy(false);
    }
  }

  const handlePlaceBid = async () => {
    if (!biddingPlayer || !user) return;

    if (bidAmount < biddingPlayer.cost) {
      toast({ variant: 'destructive', title: 'Invalid Bid', description: `Your bid must be at least the base cost of ${biddingPlayer.cost.toLocaleString()}.` });
      return;
    }

    try {
      const response = await fetch(`/api/players/${biddingPlayer.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: bidAmount }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      
      toast({
          title: 'Bid Placed!',
          description: `You have bid ${bidAmount.toLocaleString()} for ${biddingPlayer.name}.`,
      });
      setIsBidDialogOpen(false);
      await fetchMarket(); // Refresh market to show new bid status
      await loadAllData(); // Refresh user data to reflect new currency/bid state
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error placing bid',
            description: error.message,
        });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2">
            <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold font-headline">
                Daily Auction Market
            </h1>
            </div>
            <p className="text-muted-foreground mt-2">
            Bid on new talent! The market automatically resets daily.
            </p>
            <Button onClick={handleFindJuiciest} disabled={isFindingJuicy || isMarketLoading || marketPlayers.length === 0} className="mt-4 bg-amber-500 hover:bg-amber-600">
                {isFindingJuicy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gem className="mr-2 h-4 w-4" />}
                Find the Juiciest Player!
            </Button>
        </div>
        <div className="w-full md:w-auto md:justify-self-end">
          <CountdownClock onTimerEnd={runAutomatedTasks} />
        </div>
      </header>

      {user?.id === 'user-sipgb' && (
        <div className="flex items-center gap-2 mb-8 p-4 border-l-4 border-amber-500 bg-amber-50 rounded-lg">
             <p className="text-sm text-amber-800">
              Admin controls: Manually trigger market events if needed.
            </p>
            <Button onClick={handleRefreshMarket} variant="outline" size="sm" disabled={isMarketLoading || isRefreshing}>
                {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Regenerate Now
            </Button>
             <Button onClick={handleLockIn} size="sm" disabled={isLocking}>
                {isLocking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gavel className="mr-2 h-4 w-4" />}
                Lock In Now
            </Button>
        </div>
      )}

      <div>
        {isMarketLoading ? (
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {marketPlayers.length > 0 ? marketPlayers.map((player) => (
              <AuctionListItem key={player.id} player={player} onBid={handleBidClick} isJuicy={juicyPlayer?.id === player.id} juicyReason={juicyPlayer?.reason} />
            )) : (
              <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <p className="text-lg text-muted-foreground">The market is empty. It will refresh at the next reset time.</p>
              </div>
            )}
          </div>
        )}
      </div>

       {biddingPlayer && (
        <Dialog open={isBidDialogOpen} onOpenChange={setIsBidDialogOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Place a bid for {biddingPlayer.name}</DialogTitle>
                <DialogDescription>
                 The base cost is {biddingPlayer.cost.toLocaleString()}. Your bid is secret. The highest bid at the end of the auction wins the player.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <div className="flex items-center gap-2">
                <Input 
                    id="bidAmount"
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    min={biddingPlayer.cost}
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
                <Button onClick={handlePlaceBid} disabled={bidAmount < biddingPlayer.cost}>
                   {`Bid ${bidAmount.toLocaleString()}`}
                </Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
