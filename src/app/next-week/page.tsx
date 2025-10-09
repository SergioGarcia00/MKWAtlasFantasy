
'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerIcon } from '@/components/icons/player-icon';
import type { Player } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

export default function NextWeekPage() {
  const { allUsers } = useUser();
  const [week, setWeek] = useState(1);

  const handleNextWeek = () => {
    // In a real scenario, this would trigger score calculations, player payments, etc.
    setWeek(prevWeek => prevWeek + 1);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
            <h1 className="text-4xl font-bold font-headline">Week {week} Simulation</h1>
            <p className="text-muted-foreground mt-2">
            Review all user lineups for the upcoming week.
            </p>
        </div>
        <Button onClick={handleNextWeek} className="bg-accent hover:bg-accent/90">
            Simulate Next Week
        </Button>
      </header>

      <div className="space-y-8">
        {allUsers.length > 0 ? (
          allUsers.map(user => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle>{user.name}'s Roster</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Starting Lineup ({user.roster.lineup.length}/6)</h3>
                  {user.roster.lineup.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {(user.roster.lineup as Player[]).map(player => (
                        <div key={player.id} className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg text-center">
                          <PlayerIcon iconName={player.icon} className="w-16 h-16" />
                          <p className="mt-2 font-semibold text-sm">{player.name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No players in lineup.</p>
                  )}
                </div>
                <Separator className="my-6" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Bench ({user.roster.bench.length})</h3>
                   {user.roster.bench.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
                      {(user.roster.bench as Player[]).map(player => (
                        <div key={player.id} className="flex flex-col items-center justify-center p-2 bg-secondary/50 rounded-lg text-center">
                          <PlayerIcon iconName={player.icon} className="w-10 h-10" />
                          <p className="mt-1 font-medium text-xs">{player.name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Bench is empty.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex h-48 items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
