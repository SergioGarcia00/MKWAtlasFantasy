export type PlayerStats = {
  speed: number;
  acceleration: number;
  weight: number;
  handling: number;
  traction: number;
};

export type Bid = {
  userId: string;
  userName: string;
  amount: number;
};

export type Player = {
  id: string;
  name: string;
  icon: string;
  cost: number;
  stats: PlayerStats;
  mmr?: number;
  peak_mmr?: number;
  rank?: number;
  events_played?: number;
  country?: string;
  game_stats?: {
    '1v1'?: GameStats;
    '2v2'?: GameStats;
  };
  bids?: Bid[];
  registry_url?: string;
};

export type WeeklyScore = {
  race1: number;
  race2: number;
};

export type UserPlayer = {
  id: string;
  purchasedAt: number;
  purchasePrice?: number;
  clauseInvestment?: number;
}

export type User = {
  id: string;
  name: string;
  currency: number;
  players: UserPlayer[]; // Now stores player IDs with purchase dates
  roster: {
    lineup: string[]; // Store only player IDs
    bench: string[]; // Store only player IDs
  };
  weeklyScores: Record<string, Record<string, WeeklyScore>>; // Keyed by player ID, then by week ID
  bids: Record<string, number>; // Keyed by player ID, value is bid amount
};


export interface RosterPlayer {
  name: string;
  role: string | null;
  friend_code: string;
  joined_at: string;
  rank?: number;
  mmr?: number;
  cost?: number; // Added cost to RosterPlayer
  peak_mmr?: number;
  registry_link?: string;
  country?: string;
  events_played?: number;
  registry_url?: string;
  game_stats?: {
    '1v1'?: GameStats;
    '2v2'?: GameStats;
  };
}

export interface GameStats {
  events_played: number;
  win_rate: string;
  win_loss_last_10: string;
  gainloss_last_10: number;
  largest_gain: number;
  average_score: number;
  average_score_no_sq?: number;
  average_score_last_10: number;
  partner_average_score?: number;
  partner_average_score_no_sq?: number;
}

export interface RosterTeam {
  teamId: number;
  teamName: string;
  teamTag: string;
  subteam: string;
  badges: string[];
  players: RosterPlayer[];
}
