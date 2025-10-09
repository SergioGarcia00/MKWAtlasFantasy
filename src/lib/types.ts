export type PlayerStats = {
  speed: number;
  acceleration: number;
  weight: number;
  handling: number;
  traction: number;
};

export type Player = {
  id: string;
  name: string;
  icon: string;
  cost: number;
  stats: PlayerStats;
};

export type WeeklyScore = {
  race1: number;
  race2: number;
};

export type User = {
  id: string;
  name: string;
  currency: number;
  players: Player[];
  roster: {
    lineup: Player[];
    bench: Player[];
  };
  weeklyScores: Record<string, WeeklyScore>; // Keyed by player ID
};
