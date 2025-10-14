'use client';

import { useUser } from '@/context/user-context';
import type { Player } from '@/lib/types';
import { RosterPlayerCard } from '@/components/roster-player-card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Users, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function RosterPage() {
  const { user, updateRoster, getPlayerById, sellPlayer } = useUser();

  if (!user) {
    return <div className="flex h-full items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const lineupPlayers = user.roster.lineup.map(id => getPlayerById(id)).filter(p => p) as Player[];
  const benchPlayers = user.roster.bench.map(id => getPlayerById(id)).filter(p => p) as Player[];

  const handleMovePlayer = (player: Player) => {
    if (!user) return;
    const isInLineup = lineupPlayers.some(p => p.id === player.id);
    
    let newLineupIds: string[];
    let newBenchIds: string[];

    if (isInLineup) {
      // Move from lineup to bench
      newLineupIds = user.roster.lineup.filter(id => id !== player.id);
      newBenchIds = [...user.roster.bench, player.id];
    } else {
      // Move from bench to lineup
      if (lineupPlayers.length >= 6) {
        alert('Your lineup is full. You can only have 6 players in the starting lineup.');
        return;
      }
      newBenchIds = user.roster.bench.filter(id => id !== player.id);
      newLineupIds = [...user.roster.lineup, player.id];
    }
    updateRoster(newLineupIds, newBenchIds);
  };
  
  const canMoveToLineup = lineupPlayers.length < 6;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Manage Your Roster</h1>
        <p className="text-muted-foreground mt-2">
          Set your starting lineup and update weekly scores. Your starting lineup is limited to 6 players.
        </p>
      </header>

      {user.players.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Your roster is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground">You need to purchase players from the store first.</p>
          <div className="mt-6">
            <Button asChild className="bg-accent hover:bg-accent/90">
              <Link href="/daily-market">Go to Daily Market</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-7 h-7 text-primary"/>
                <h2 className="text-2xl font-semibold font-headline">Starting Lineup ({lineupPlayers.length}/6)</h2>
              </div>
              {lineupPlayers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lineupPlayers.map(player => (
                    <RosterPlayerCard key={player.id} player={player} isLineup={true} onMove={handleMovePlayer} onSell={sellPlayer} canMoveToLineup={canMoveToLineup} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No players in your starting lineup.</p>
              )}
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-3 mb-4">
                 <Users className="w-7 h-7 text-muted-foreground"/>
                 <h2 className="text-2xl font-semibold font-headline">Bench ({benchPlayers.length})</h2>
              </div>
              {benchPlayers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benchPlayers.map(player => (
                    <RosterPlayerCard key={player.id} player={player} isLineup={false} onMove={handleMovePlayer} onSell={sellPlayer} canMoveToLineup={canMoveToLineup} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">Your bench is empty.</p>
              )}
            </div>
          </div>
          
          <aside className="lg:col-span-1">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Roster Tips</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Your user rank is based on the total score of your <strong>starting lineup</strong>.</li>
                  <li>Remember to update your players' scores weekly to stay competitive.</li>
                  <li>Scores for benched players do not count towards your weekly total.</li>
                  <li>You must have a full lineup of 6 players to appear on the User Rankings.</li>
                </ul>
              </AlertDescription>
            </Alert>
          </aside>
        </div>
      )}
    </div>
  );
}
