'use server';
/**
 * @fileOverview An AI agent that identifies the most promising player in the auction market.
 *
 * - findJuiciestPlayer - A function that handles the player evaluation process.
 * - JuiciestPlayerInput - The input type for the findJuiciestPlayer function.
 * - JuiciestPlayerOutput - The return type for the findJuiciestPlayer function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  cost: z.number(),
  mmr: z.number().optional(),
  peak_mmr: z.number().optional(),
  rank: z.number().optional(),
  events_played: z.number().optional(),
  country: z.string().optional(),
  game_stats: z
    .object({
      '1v1': z.object({
        win_rate: z.string().optional(),
        win_loss_last_10: z.string().optional(),
        average_score_last_10: z.number().optional(),
      }).optional(),
      '2v2': z.object({
         win_rate: z.string().optional(),
        win_loss_last_10: z.string().optional(),
        average_score_last_10: z.number().optional(),
      }).optional(),
    }).optional(),
});

export const JuiciestPlayerInputSchema = z.object({
  players: z.array(PlayerSchema).describe('A list of players available in the daily auction market.'),
});
export type JuiciestPlayerInput = z.infer<typeof JuiciestPlayerInputSchema>;

export const JuiciestPlayerOutputSchema = z.object({
  id: z.string().describe('The ID of the juiciest player.'),
  name: z.string().describe('The name of the juiciest player.'),
  reason: z.string().describe('A short, compelling reason (max 20 words) explaining why this player is the "juiciest" or best value pick.'),
});
export type JuiciestPlayerOutput = z.infer<typeof JuiciestPlayerOutputSchema>;

export async function findJuiciestPlayer(input: JuiciestPlayerInput): Promise<JuiciestPlayerOutput> {
  return juiciestPlayerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'juiciestPlayerPrompt',
  input: { schema: JuiciestPlayerInputSchema },
  output: { schema: JuiciestPlayerOutputSchema },
  prompt: `You are an expert Mario Kart fantasy league analyst. Your task is to identify the "juiciest" player from a list of available auction players.

A "juicy" player is one who represents the best value. This means they might be:
- Undervalued: Their cost is low compared to their MMR, peak MMR, or recent performance.
- On an upward trend: Their recent stats (like win/loss in the last 10 games) are very strong, suggesting their MMR is about to increase.
- A hidden gem: A player with solid stats who might be overlooked by others.

Analyze the following list of players and identify the single best one to recommend. Provide a short, sharp, and compelling reason for your choice.

Players:
{{#each players}}
- Player ID: {{id}}
- Name: {{name}}
- Cost: {{cost}}
- MMR: {{mmr}}
- Peak MMR: {{peak_mmr}}
- Rank: {{rank}}
- Win Rate (1v1): {{game_stats.[1v1].win_rate}}
- Win/Loss Last 10 (1v1): {{game_stats.[1v1].win_loss_last_10}}
- Avg Score Last 10 (1v1): {{game_stats.[1v1].average_score_last_10}}
{{/each}}
`,
});

const juiciestPlayerFlow = ai.defineFlow(
  {
    name: 'juiciestPlayerFlow',
    inputSchema: JuiciestPlayerInputSchema,
    outputSchema: JuiciestPlayerOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
