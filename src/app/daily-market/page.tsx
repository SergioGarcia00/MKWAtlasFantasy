'use client';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/user-context';
import { Sparkles, Loader2, RefreshCw, Gavel, Clock } from 'lucide-react';
import { AuctionListItem } from '@/components/auction-list-item';
import { Player } from '@/lib/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

export type Bid = { userId: string; userName: string; amount: number };

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
  const { user, allUsers, switchUser, getPlayerById, loadAllData } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const marketCollectionRef = useMemo(() => firestore ? collection(firestore, 'market') : null, [firestore]);
  const { data: marketPlayers, isLoading: isMarketLoading } = useCollection<Player>(marketCollectionRef);

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
  
  const handleDownloadBidsCsv = () => {
    // This is a client-side function and doesn't need to be migrated for now.
  };

  const handleRefreshMarket = useCallback(async () => {
    // This action would now be a server-side function (e.g., Firebase Function)
    // triggered by an API call. For now, we'll show a toast.
    toast({ title: 'Action Not Migrated', description: 'Market refresh logic needs to be a server-side function.' });
  }, [toast]);

  const handleLockIn = useCallback(async () => {
    // This action would now be a server-side function (e.g., Firebase Function)
    toast({ title: 'Action Not Migrated', description: 'Auction lock-in logic needs to be a server-side function.' });
  }, [toast]);

  const runAutomatedTasks = useCallback(async () => {
        if (user?.id !== 'user-sipgb') return;
        toast({ title: 'Automated Market Update', description: 'This would trigger a server function.' });
    }, [user, toast]);


  const handleBidClick = (player: Player) => {
    setBidAmount(player.cost);
    setBiddingPlayer(player);
    setIsBidding(true);
  };

  const handlePlaceBid = async () => {
    if (!biddingPlayer || !user || !firestore) return;

    if (bidAmount < biddingPlayer.cost) {
      toast({ variant: 'destructive', title: 'Invalid Bid', description: `Your bid must be at least the base cost of ${biddingPlayer.cost.toLocaleString()}.` });
      return;
    }

    setIsBidLoading(true);
    const userRef = doc(firestore, 'users', user.id);

    try {
      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User document does not exist!");
        
        const userData = userDoc.data();
        const otherBidsAmount = Object.entries(userData.bids || {})
          .filter(([pId]) => pId !== biddingPlayer.id)
          .reduce((sum, [, amount]) => sum + (amount as number), 0);

        if (userData.currency < (otherBidsAmount + bidAmount)) {
          throw new Error('Insufficient funds for this bid considering your other active bids.');
        }

        const newBids = { ...userData.bids, [biddingPlayer.id]: bidAmount };
        transaction.update(userRef, { bids: newBids });
      });
      
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
        </div>
        <div className="w-full md:w-auto md:justify-self-end">
          <CountdownClock onTimerEnd={runAutomatedTasks} />
        </div>
      </header>

      {user?.id === 'user-sipgb' && (
        <div className="flex items-center gap-2 mb-8 p-4 border-l-4 border-amber-500 bg-amber-50 rounded-lg">
             <p className="text-sm text-amber-800">
              Admin controls: These actions should be migrated to server-side Firebase Functions.
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
            {marketPlayersWithBids.length > 0 ? marketPlayersWithBids.map((player) => (
              <AuctionListItem key={player.id} player={player} onBid={handleBidClick} />
            )) : (
              <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <p className="text-lg text-muted-foreground">The market is empty. It will refresh at the next reset time.</p>
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
                <Button onClick={handlePlaceBid} disabled={isBidLoading || bidAmount < biddingPlayer.cost}>
                    {isBidLoading ? <Loader2 className="animate-spin" /> : `Bid ${bidAmount.toLocaleString()}`}
                </Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
