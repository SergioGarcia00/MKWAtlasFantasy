import type { Player } from '@/lib/types';
import playersData from '@/lib/rosters_actualizado.json';

// This flattens the nested player arrays from all teams into a single array
const allRosterPlayers = playersData.flatMap(team => team.players);

// Helper to create a consistent, unique ID for each player
const createPlayerId = (player: any): string => {
  const name = player.name.replace(/\s+/g, '-');
  const peakMmr = player.peak_mmr || 0;
  const friendCode = player.friend_code || '0000';
  return `${name}-${peakMmr}-${friendCode.slice(-4)}`;
};

export const ALL_PLAYERS: Player[] = allRosterPlayers
  .filter(p => p.peak_mmr && p.friend_code) // Ensure players have the necessary data to create a stable ID
  .map(p => ({
    id: createPlayerId(p),
    name: p.name,
    icon: ['Mario', 'Luigi', 'Peach', 'Yoshi', 'Bowser', 'DK', 'Toad', 'Koopa'][Math.floor(Math.random() * 8)],
    cost: p.cost || Math.round(p.peak_mmr! * 0.8),
    stats: {
        speed: Math.floor(Math.random() * 8) + 2,
        acceleration: Math.floor(Math.random() * 8) + 2,
        weight: Math.floor(Math.random() * 8) + 2,
        handling: Math.floor(Math.random() * 8) + 2,
        traction: Math.floor(Math.random() * 8) + 2,
    },
    mmr: p.mmr,
    peak_mmr: p.peak_mmr,
    rank: p.rank,
    events_played: p.events_played,
    country: p.country,
    game_stats: p.game_stats,
}));
