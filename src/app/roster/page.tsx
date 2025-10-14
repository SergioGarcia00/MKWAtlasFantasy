'use client';

import { useUser } from '@/context/user-context';
import type { Player } from '@/lib/types';
import { RosterPlayerCard } from '@/components/roster-player-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Users, ShieldCheck, ArrowRight, ServerCrash, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';
import { Separator } from '@/components/ui/separator';

export default function RosterPage() {
  const { user, getPlayerById, updateRoster, sellPlayer, isUserLoading } = useUser();

  const lineupPlayers = useMemo(() => {
    if (!user) return [];
    return (user.roster.lineup || [])
      .map(id => getPlayerById(id))
      .filter((p): p is Player => p !== undefined);
  }, [user, getPlayerById]);

  const allOwnedPlayers = useMemo(() => {
    if (!user) return [];
    return (user.players || [])
      .map(p => getPlayerById(p.id))
      .filter((p): p is Player => p !== undefined)
      .sort((a,b) => (b.mmr || 0) - (a.mmr || 0)); // Sort by MMR descending
  }, [user, getPlayerById]);


  if (isUserLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleMovePlayer = (player: Player, isCurrentlyInLineup: boolean) => {
    if (!user) return;
    
    let newLineupIds: string[];

    if (isCurrentlyInLineup) {
      // Move from lineup to bench (i.e., remove from lineup)
      newLineupIds = user.roster.lineup.filter(id => id !== player.id);
    } else {
      // Move from bench to lineup
      if (user.roster.lineup.length >= 6) {
        alert('Your lineup is full. You can only have 6 players in the starting lineup.');
        return;
      }
      newLineupIds = [...user.roster.lineup, player.id];
    }
    
    const allOwnedPlayerIds = user.players.map(p => p.id);
    const newBenchIds = allOwnedPlayerIds.filter(id => !newLineupIds.includes(id));
    
    updateRoster(newLineupIds, newBenchIds);
  };
  
  const canMoveToLineup = lineupPlayers.length < 6;

  const lineupPlayerIds = new Set(lineupPlayers.map(p => p.id));

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Manage Your Roster</h1>
        <p className="text-muted-foreground mt-2">
          Set your starting lineup. Only scores from your 6 lineup players count towards your weekly total.
        </p>
      </header>

      {allOwnedPlayers.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Your Roster is Empty</h3>
          <p className="mt-1 text-sm text-muted-foreground">You need to acquire players from the market first.</p>
          <Button asChild className="mt-6">
            <Link href="/daily-market">
                Go to Daily Market <ArrowRight className="ml-2"/>
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                    <ShieldCheck className="w-7 h-7 text-primary"/>
                    Starting Lineup ({lineupPlayers.length}/6)
                    </CardTitle>
                    <CardDescription>
                        These are the 6 players that will score points for you this week. Drag and drop from your player list or use the move buttons.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lineupPlayers.map(player => (
                            <RosterPlayerCard 
                                key={player.id} 
                                player={player} 
                                isLineup={true} 
                                onMove={handleMovePlayer} 
                                onSell={sellPlayer} 
                                canMoveToLineup={canMoveToLineup} 
                            />
                        ))}
                        {[...Array(6 - lineupPlayers.length)].map((_, i) => (
                            <div key={`placeholder-${i}`} className="flex items-center justify-center p-4 h-full min-h-[160px] border-2 border-dashed rounded-lg bg-secondary/50">
                                <div className="text-center text-muted-foreground">
                                    <PlusCircle className="mx-auto h-8 w-8 mb-2" />
                                    <p className="font-semibold">Empty Slot</p>
                                </div>
                            </div>
                        ))}
                    </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1 space-y-8 sticky top-4">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Users className="w-7 h-7 text-muted-foreground"/>
                        My Players ({allOwnedPlayers.length})
                    </CardTitle>
                    <CardDescription>
                       All players you own. A green dot indicates they are in the starting lineup.
                    </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[80vh] overflow-y-auto pr-2">
                    <div className="space-y-4">
                        {allOwnedPlayers.map(player => {
                        const isLineup = lineupPlayerIds.has(player.id);
                        return (
                            <RosterPlayerCard 
                            key={player.id} 
                            player={player} 
                            isLineup={isLineup} 
                            onMove={handleMovePlayer} 
                            onSell={sellPlayer} 
                            canMoveToLineup={canMoveToLineup} 
                            />
                        )
                        })}
                    </div>
                </CardContent>
             </Card>
          </div>
        </div>
      )}
    </div>
  );
}
