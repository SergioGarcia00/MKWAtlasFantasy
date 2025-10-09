'use client';

import { useState, useMemo } from 'react';
import { ALL_PLAYERS } from '@/data/players';
import type { Player } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlayerIcon } from '@/components/icons/player-icon';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

type SortKey = keyof Player['stats'] | 'name' | 'cost' | 'performance';

const calculatePerformance = (player: Player) => {
  const { speed, acceleration, handling, weight, traction } = player.stats;
  // A weighted formula to calculate a general performance score
  return Math.round((speed * 1.5 + acceleration * 1.2 + handling * 1.1 - weight * 0.5 + traction * 0.8) * 10);
};

export default function PlayerRankingsPage() {
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'performance', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  const playersWithPerformance = useMemo(() => 
    ALL_PLAYERS.map(p => ({ ...p, performance: calculatePerformance(p) })),
    []
  );

  const filteredAndSortedPlayers = useMemo(() => {
    let players = [...playersWithPerformance];

    if (searchTerm) {
      players = players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    players.sort((a, b) => {
      let valA, valB;
      const { key, direction } = sortConfig;

      if (key === 'performance' || key === 'cost' || key === 'name') {
        valA = a[key];
        valB = b[key];
      } else {
        valA = a.stats[key as keyof Player['stats']];
        valB = b.stats[key as keyof Player['stats']];
      }
      
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return players;
  }, [playersWithPerformance, sortConfig, searchTerm]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const headers: { key: SortKey; label: string; className?: string }[] = [
    { key: 'name', label: 'Player' },
    { key: 'cost', label: 'Cost', className: 'text-right' },
    { key: 'stats.speed', label: 'Speed', className: 'text-right hidden sm:table-cell' },
    { key: 'stats.acceleration', label: 'Accel', className: 'text-right hidden sm:table-cell' },
    { key: 'stats.weight', label: 'Weight', className: 'text-right hidden md:table-cell' },
    { key: 'stats.handling', label: 'Handling', className: 'text-right hidden md:table-cell' },
    { key: 'stats.traction', label: 'Traction', className: 'text-right hidden lg:table-cell' },
    { key: 'performance', label: 'Perf. Score', className: 'text-right' },
  ];

  return (
    <div className="w-full">
      <div className="mb-4">
        <Input 
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map(header => (
                <TableHead key={header.key} className={header.className}>
                  <Button variant="ghost" onClick={() => handleSort(header.key as SortKey)}>
                    {header.label}
                    {sortConfig.key === header.key && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedPlayers.map(player => (
              <TableRow key={player.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <PlayerIcon iconName={player.icon} className="w-8 h-8 text-primary" />
                    <span className="font-medium">{player.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">{player.cost.toLocaleString()}</TableCell>
                <TableCell className="text-right hidden sm:table-cell">{player.stats.speed}</TableCell>
                <TableCell className="text-right hidden sm:table-cell">{player.stats.acceleration}</TableCell>
                <TableCell className="text-right hidden md:table-cell">{player.stats.weight}</TableCell>
                <TableCell className="text-right hidden md:table-cell">{player.stats.handling}</TableCell>
                <TableCell className="text-right hidden lg:table-cell">{player.stats.traction}</TableCell>
                <TableCell className="font-semibold text-primary text-right">{player.performance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       {filteredAndSortedPlayers.length === 0 && (
          <div className="text-center col-span-full py-16">
              <p className="text-lg text-muted-foreground">No players found for "{searchTerm}".</p>
          </div>
      )}
    </div>
  );
}