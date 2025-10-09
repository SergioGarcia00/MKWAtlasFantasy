'use client';

import { useState, useMemo } from 'react';
import { ALL_PLAYERS } from '@/data/players';
import type { Player } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlayerIcon } from '@/components/icons/player-icon';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SortKey = keyof Player | 'performance';

const calculatePerformance = (player: Player) => {
  const { speed, acceleration, handling, weight, traction } = player.stats;
  return Math.round((speed * 1.5 + acceleration * 1.2 + handling * 1.1 - weight * 0.5 + traction * 0.8) * 10);
};

export default function PlayerRankingsPage() {
  const [sortKey, setSortKey] = useState<SortKey>('performance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedPlayers = useMemo(() => {
    const playersWithPerf = ALL_PLAYERS.map(p => ({ ...p, performance: calculatePerformance(p) }));
    
    return [...playersWithPerf].sort((a, b) => {
      let valA, valB;

      if (sortKey === 'performance' || sortKey === 'cost') {
        valA = a[sortKey];
        valB = b[sortKey];
      } else if (sortKey === 'name') {
        valA = a.name;
        valB = b.name;
      } else {
        valA = a.stats[sortKey as keyof Player['stats']];
        valB = b.stats[sortKey as keyof Player['stats']];
      }

      if (valA < valB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const headers: { key: SortKey; label: string; className?: string }[] = [
    { key: 'name', label: 'Player' },
    { key: 'cost', label: 'Cost', className: 'text-right' },
    { key: 'stats.speed', label: 'Speed', className: 'text-right' },
    { key: 'stats.acceleration', label: 'Accel', className: 'text-right' },
    { key: 'stats.weight', label: 'Weight', className: 'text-right' },
    { key: 'stats.handling', label: 'Handling', className: 'text-right' },
    { key: 'stats.traction', label: 'Traction', className: 'text-right' },
    { key: 'performance', label: 'Perf. Score', className: 'text-right' },
  ];

  return (
    <div className="w-full">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map(header => (
                <TableHead key={header.key} className={header.className}>
                  <Button variant="ghost" onClick={() => handleSort(header.key as SortKey)}>
                    {header.label}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map(player => (
              <TableRow key={player.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <PlayerIcon iconName={player.icon} className="w-8 h-8 text-primary" />
                    <span className="font-medium">{player.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{player.cost.toLocaleString()}</TableCell>
                <TableCell className="text-right">{player.stats.speed}</TableCell>
                <TableCell className="text-right">{player.stats.acceleration}</TableCell>
                <TableCell className="text-right">{player.stats.weight}</TableCell>
                <TableCell className="text-right">{player.stats.handling}</TableCell>
                <TableCell className="text-right">{player.stats.traction}</TableCell>
                <TableCell className="font-semibold text-primary text-right">{player.performance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
