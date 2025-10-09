import { z } from 'zod';

export const playerStatsSchema = z.object({
  speed: z.number(),
  acceleration: z.number(),
  weight: z.number(),
  handling: z.number(),
  traction: z.number(),
});

export const gameStatsSchema = z.object({
  events_played: z.number().optional(),
  win_rate: z.string().optional(),
  win_loss_last_10: z.string().optional(),
  gainloss_last_10: z.number().optional(),
  largest_gain: z.number().optional(),
  average_score: z.number().optional(),
  average_score_no_sq: z.number().optional(),
  average_score_last_10: z.number().optional(),
  partner_average_score: z.number().optional(),
  partner_average_score_no_sq: z.number().optional(),
});

export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  cost: z.number(),
  stats: playerStatsSchema,
  mmr: z.number().optional(),
  peak_mmr: z.number().optional(),
  rank: z.number().optional(),
  events_played: z.number().optional(),
  country: z.string().optional(),
  game_stats: z
    .object({
      '1v1': gameStatsSchema.optional(),
      '2v2': gameStatsSchema.optional(),
    })
    .optional(),
});

export const weeklyScoreSchema = z.object({
  race1: z.number(),
  race2: z.number(),
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.number(),
  players: z.array(playerSchema),
  roster: z.object({
    lineup: z.array(playerSchema),
    bench: z.array(playerSchema),
  }),
  weeklyScores: z.record(z.record(weeklyScoreSchema)),
});
