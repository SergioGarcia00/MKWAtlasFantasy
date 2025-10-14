'use client';

import { useUser } from '@/context/user-context';
import type { Player } from '@/lib/types';
import { RosterPlayerCard } from '@/components/roster-player-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Users, ShieldCheck, ArrowRight, ServerCrash } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

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
      .filter((p): p is Player => p !== undefined);
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
      // Move from lineup to bench
      newLineupIds = user.roster.lineup.filter(id => id !== player.id);
    } else {
      // Move from bench to lineup
      if (user.roster.lineup.length >= 6) {
        alert('Your lineup is full. You can only have 6 players in the starting lineup.');
        return;
      }
      newLineupIds = [...user.roster.lineup, player.id];
    }
    
    // The bench is implicitly all owned players not in the lineup.
    // The user context handles updating the user object and sending it to the API.
    const allOwnedPlayerIds = user.players.map(p => p.id);
    const newBenchIds = allOwnedPlayerIds.filter(id => !newLineupIds.includes(id));
    
    updateRoster(newLineupIds, newBenchIds);
  };
  
  const canMoveToLineup = lineupPlayers.length < 6;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Manage Your Roster</h1>
        <p className="text-muted-foreground mt-2">
          Set your starting lineup. Your lineup is limited to 6 players, and only their scores count towards your weekly total.
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
              </CardHeader>
              <CardContent>
                {lineupPlayers.length > 0 ? (
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
                  </div>
                ) : (
                  <div className="text-center py-10 border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
                    <ServerCrash className="w-10 h-10 text-destructive mb-2" />
                    <p className="text-muted-foreground font-semibold">Your lineup is empty!</p>
                    <p className="text-xs text-muted-foreground mt-1">Move players from your player list to the lineup.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Users className="w-7 h-7 text-muted-foreground"/>
                        My Players ({allOwnedPlayers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {allOwnedPlayers.length > 0 ? (
                        <div className="space-y-4">
                          {allOwnedPlayers.map(player => {
                            const isLineup = lineupPlayers.some(p => p.id === player.id);
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
                    ) : (
                        <p className="text-muted-foreground italic text-center py-4">You do not own any players.</p>
                    )}
                </CardContent>
             </Card>
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Roster Tips</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                  <li>Your rank is based on the total score of your <strong>starting lineup</strong>.</li>
                  <li>A green dot indicates a player is in your starting lineup.</li>
                  <li>Scores for players not in the lineup do not count towards your weekly total.</li>
                  <li>You need a full lineup of 6 players to appear on the User Rankings.</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
    </div>
  );
}
