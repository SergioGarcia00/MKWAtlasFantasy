'use client';

import { useState, useMemo } from 'react';
import { ALL_PLAYERS } from '@/data/players';
import type { Player } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlayerIcon } from '@/components/icons/player-icon';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/context/user-context';

type SortKey = 'name' | 'cost' | 'totalScore';

const calculatePlayerTotalScore = (playerId: string, allUsers: any[]) => {
  let totalScore = 0;
  for (const user of allUsers) {
    if (user.weeklyScores && user.weeklyScores[playerId]) {
      const scores = user.weeklyScores[playerId];
      totalScore += (scores.race1 || 0) + (scores.race2 || 0);
      break; 
    }
  }
  return totalScore;
};

export default function PlayerRankingsPage() {
  const { allUsers } = useUser();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'totalScore', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  const playersWithScores = useMemo(() => {
    if (!allUsers) return [];
    return ALL_PLAYERS.map(p => ({
      ...p,
      totalScore: calculatePlayerTotalScore(p.id, allUsers),
    }));
  }, [allUsers]);

  const filteredAndSortedPlayers = useMemo(() => {
    let players = [...playersWithScores];

    if (searchTerm) {
      players = players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    players.sort((a, b) => {
      const { key, direction } = sortConfig;
      const valA = a[key];
      const valB = b[key];
      
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return players;
  }, [playersWithScores, sortConfig, searchTerm]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const headers: { key: SortKey; label: string; className?: string }[] = [
    { key: 'name', label: 'Player' },
    { key: 'cost', label: 'Cost', className: 'text-right' },
    { key: 'totalScore', label: 'Total Weekly Score', className: 'text-right' },
  ];

  if (!allUsers || allUsers.length === 0) {
      return (
        <div className="flex h-48 items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
  }

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
                <TableCell className="font-semibold text-primary text-right text-lg">{player.totalScore}</TableCell>
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
       <p className="text-xs text-muted-foreground mt-4">*Only players with scores from the latest week are shown.</p>
    </div>
  );
}
