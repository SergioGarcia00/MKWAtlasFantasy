import type { Player } from '@/lib/types';
import playersData from '@/lib/rosters_actualizado.json';

// This flattens the nested player arrays from all teams into a single array
const allRosterPlayers = playersData.flatMap(team => team.players);

// Helper to create a consistent, unique ID for each player
const createPlayerId = (player: any): string => {
  const name = player.name.replace(/\s+/g, '-');
  const peakMmr = player.peak_mmr || 0;
  // Use a consistent part of the friend code if available
  const friendCodeSuffix = (player.friend_code || '0000').slice(-4);
  return `${name}-${peakMmr}-${friendCodeSuffix}`;
};

const iconNames: Player['icon'][] = ['Mario', 'Luigi', 'Peach', 'Yoshi', 'Bowser', 'DK', 'Toad', 'Koopa'];

export const ALL_PLAYERS: Player[] = allRosterPlayers
  // Filter out players who lack the essential data for a stable ID
  .filter(p => p.name && p.peak_mmr && p.friend_code)
  .map((p, index) => ({
    id: createPlayerId(p),
    name: p.name,
    // Use a deterministic way to assign icons instead of random
    icon: iconNames[index % iconNames.length],
    cost: p.cost || Math.round(p.peak_mmr! * 0.8),
    stats: {
        // Use a deterministic calculation for stats
        speed: (p.peak_mmr! % 8) + 2,
        acceleration: (p.cost! % 8) + 2,
        weight: (p.events_played! % 8) + 2,
        handling: ((p.peak_mmr! + p.cost!) % 8) + 2,
        traction: ((p.rank || 0) % 8) + 2,
    },
    mmr: p.mmr,
    peak_mmr: p.peak_mmr,
    rank: p.rank,
    events_played: p.events_played,
    country: p.country,
    game_stats: p.game_stats,
}));

// Create a map to ensure no duplicate IDs are generated.
const playerMap = new Map<string, Player>();
for (const player of ALL_PLAYERS) {
    if (playerMap.has(player.id)) {
        console.warn(`Duplicate player ID detected: ${player.id}. This may cause issues.`);
        // Optional: handle duplicates, e.g., by adding an index to the ID
    }
    playerMap.set(player.id, player);
}

// Export the deduplicated list
export const UNIQUE_PLAYERS: Player[] = Array.from(playerMap.values());
