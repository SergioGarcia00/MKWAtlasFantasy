import type { Player, RosterTeam } from '@/lib/types';
import rosters from '@/lib/rosters_actualizado.json';

const characterIcons = ['Mario', 'Luigi', 'Peach', 'Yoshi', 'Bowser', 'DK', 'Toad', 'Koopa'];

// Helper function to generate stats based on MMR
const generateStatsFromMmr = (mmr: number = 5000) => {
  const normalizedMmr = Math.max(1, Math.min(mmr, 12000)) / 12000; // Normalize MMR to 0-1 range
  
  const speed = Math.round(2 + normalizedMmr * 7); // Scale 2-9
  const acceleration = Math.round(10 - normalizedMmr * 7); // Scale 3-10
  const weight = Math.round(2 + normalizedMmr * 8); // Scale 2-10
  const handling = Math.round(10 - normalizedMmr * 6); // Scale 4-10
  const traction = Math.round(3 + normalizedMmr * 5); // Scale 3-8

  return {
    speed: Math.max(1, Math.min(speed, 10)),
    acceleration: Math.max(1, Math.min(acceleration, 10)),
    weight: Math.max(1, Math.min(weight, 10)),
    handling: Math.max(1, Math.min(handling, 10)),
    traction: Math.max(1, Math.min(traction, 10)),
  };
};

const processedPlayers = new Map<string, Player>();

(rosters as RosterTeam[]).forEach(team => {
  team.players.forEach((playerData, index) => {
    // Use a combination of name and team to create a unique ID
    if (playerData.name && playerData.peak_mmr) {
        // A more unique ID to prevent collisions
        const playerId = `${playerData.name.replace(/[^a-zA-Z0-9]/g, '')}-${playerData.peak_mmr}-${team.teamId}`;

        if (!processedPlayers.has(playerId)) {
          const stats = generateStatsFromMmr(playerData.mmr);
          // The cost is now directly the peak_mmr
          const cost = playerData.peak_mmr;

          const player: Player = {
              id: playerId,
              name: playerData.name,
              // Assign icons somewhat randomly but consistently
              icon: characterIcons[index % characterIcons.length],
              cost: cost,
              stats: stats,
              mmr: playerData.mmr,
              peak_mmr: playerData.peak_mmr,
              rank: playerData.rank,
              events_played: playerData.events_played,
              country: playerData.country,
              game_stats: playerData.game_stats,
          };
          processedPlayers.set(playerId, player);
        }
    }
  });
});

export const ALL_PLAYERS: Player[] = Array.from(processedPlayers.values());
