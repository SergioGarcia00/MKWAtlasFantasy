'use client';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/user-context';
import { Sparkles, Loader2, RefreshCw, Gavel } from 'lucide-react';
import { AuctionListItem } from '@/components/auction-list-item';
import { Player } from '@/lib/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ALL_PLAYERS } from '@/data/players';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export type Bid = { userId: string; userName: string; amount: number };

export default function DailyMarketPage() {
  const { user, allUsers, switchUser, getPlayerById } = useUser();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocking, setIsLocking] = useState(false);

  const [isBidding, setIsBidding] = useState(false);
  const [biddingPlayer, setBiddingPlayer] = useState<Player | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [isBidLoading, setIsBidLoading] = useState(false);

  const allBidsByPlayer = useMemo(() => {
    return allUsers.reduce<Record<string, Bid[]>>((acc, u) => {
        Object.entries(u.bids || {}).forEach(([playerId, amount]) => {
            if (!acc[playerId]) {
                acc[playerId] = [];
            }
            acc[playerId].push({ amount, userId: u.id, userName: u.name });
        });
        return acc;
    }, {});
  }, [allUsers]);

  const recommendationsWithBids = useMemo(() => {
    return recommendations.map(player => {
        const bids = allBidsByPlayer[player.id] || [];
        const sortedBids = bids.sort((a, b) => b.amount - a.amount);
        return {
            ...player,
            bids: sortedBids,
        };
    }).sort((a,b) => (b.bids?.length || 0) - (a.bids?.length || 0));
  }, [recommendations, allBidsByPlayer]);

  const fetchRecommendations = useCallback(() => {
    setLoading(true);
    const allOwnedPlayerIds = new Set(
        allUsers.flatMap(u => u.players.map(p => p.id))
    );

    const availablePlayers = ALL_PLAYERS.filter(p => !allOwnedPlayerIds.has(p.id));
    
    const finalRecommendations = new Set<Player>();

    function addPlayersToSet(players: Player[], count: number) {
        const shuffled = shuffleArray([...players]);
        for(let i=0; i < shuffled.length && finalRecommendations.size < count; i++) {
             const player = shuffled[i];
             const fullPlayer = getPlayerById(player.id);
             if (fullPlayer && !finalRecommendations.has(fullPlayer)) {
                finalRecommendations.add(fullPlayer);
            }
        }
    }
    
    const highCostPlayers = availablePlayers.filter(p => p.cost >= 4000);
    const midCostPlayers = availablePlayers.filter(p => p.cost >= 3000 && p.cost < 4000);
    const lowCostPlayers = availablePlayers.filter(p => p.cost < 3000);

    const highRankPlayers = availablePlayers.filter(p => (p.rank || 9999) >= 1 && (p.rank || 9999) <= 200);
    const midRankPlayers = availablePlayers.filter(p => (p.rank || 9999) >= 201 && (p.rank || 9999) <= 500);
    const anyRankPlayers = availablePlayers;

    addPlayersToSet(highRankPlayers, 3);
    addPlayersToSet(midRankPlayers, 6);
    addPlayersToSet(anyRankPlayers, 9);
    addPlayersToSet(highCostPlayers, 12);
    addPlayersToSet(midCostPlayers, 15);
    addPlayersToSet(lowCostPlayers, 18);
    
    addPlayersToSet(availablePlayers, 18);

    setRecommendations(Array.from(finalRecommendations));
    setLoading(false);
  }, [allUsers, getPlayerById]);

  useEffect(() => {
    if(allUsers.length > 0) {
      fetchRecommendations();
    }
  }, [allUsers, fetchRecommendations]);

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
            title: 'Subastas Cerradas!',
            description: `${result.winners.length} jugadores han sido transferidos a sus nuevos dueños.`,
        });
        
        fetchRecommendations();
        if (user) {
          switchUser(user.id, true);
        }

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error al cerrar subastas',
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
            title: '¡Puja realizada!',
            description: `Has pujado ${bidAmount.toLocaleString()} por ${biddingPlayer.name}.`,
        });
        
        switchUser(user.id, true);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error en la puja',
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
                Mercado Diario de Subastas
            </h1>
            </div>
            <p className="text-muted-foreground mt-2">
            ¡Puja por nuevos talentos! Las subastas duran 24 horas.
            </p>
        </div>
         <div className="flex items-center gap-2">
            <Button onClick={fetchRecommendations} variant="outline" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Regenerar Mercado
            </Button>
            {user?.id === 'user-sipgb' && (
                <Button onClick={handleLockIn} disabled={isLocking}>
                    {isLocking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gavel className="mr-2 h-4 w-4" />}
                    Cerrar Subastas
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
            {recommendationsWithBids.map((player) => (
              <AuctionListItem key={player.id} player={player} onBid={handleBidClick} />
            ))}
          </div>
        )}
      </div>

       {biddingPlayer && (
        <Dialog open={isBidding} onOpenChange={setIsBidding}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Pujar por {biddingPlayer.name}</DialogTitle>
                <DialogDescription>
                {biddingPlayer.bids?.[0]
                    ? `La puja más alta actual es de ${biddingPlayer.bids[0].amount.toLocaleString()}. Tu puja debe ser mayor.`
                    : `El coste base es de ${biddingPlayer.cost.toLocaleString()}. La puja más alta al final de la subasta se lleva al jugador.`
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
                <span className="text-muted-foreground">monedas</span>
                </div>
                {user && <p className="text-xs text-muted-foreground mt-2">
                    Tu saldo: {user.currency.toLocaleString()} monedas.
                </p>}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handlePlaceBid} disabled={isBidLoading || bidAmount <= (biddingPlayer.bids?.[0]?.amount || biddingPlayer.cost -1)}>
                    {isBidLoading ? <Loader2 className="animate-spin" /> : `Pujar ${bidAmount.toLocaleString()}`}
                </Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
