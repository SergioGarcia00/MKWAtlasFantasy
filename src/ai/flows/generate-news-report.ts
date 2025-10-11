'use server';
/**
 * @fileOverview A flow for generating a news report for the fantasy league.
 *
 * - generateNewsReport: A function that takes league data and returns a news summary.
 * - GenerateNewsInput: The input type for the generateNewsReport function.
 * - GenerateNewsOutput: The return type for the generateNewsReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { userSchema } from '@/ai/schemas';

const GenerateNewsInputSchema = z.object({
  allUsers: z.array(userSchema).describe("An array of all users in the fantasy league."),
});

export type GenerateNewsInput = z.infer<typeof GenerateNewsInputSchema>;
export type GenerateNewsOutput = string;

export async function generateNewsReport(input: GenerateNewsInput): Promise<GenerateNewsOutput> {
  return generateNewsReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewsReportPrompt',
  input: { schema: GenerateNewsInputSchema },
  output: { format: 'text' },
  prompt: `You are an expert sports commentator for a Mario Kart fantasy league. 
Your tone is enthusiastic, slightly dramatic, and engaging.
Based on the provided JSON data of all users, generate a short, captivating news report (3-4 sentences).

Here's what to look for in the data:
- The user with the highest 'currency' is the richest.
- The user with the most players might be building a powerful team.
- Look at 'weeklyScores' to find standout performances (high scores in race1 or race2).
- Mention player names and the user who owns them.

Generate a news report that sounds like a sports broadcast. For example:
"What a week in the Kart Fantasy League! All eyes are on 'PlayerName', owned by 'UserName', who smashed the records with a staggering score of X in Week 1! Meanwhile, 'AnotherUserName' is making money moves, stockpiling an impressive Y fantasy coins. The question on everyone's mind is, can they be stopped?"

Here is the data for all users:
{{{json allUsers}}}
`,
});

const generateNewsReportFlow = ai.defineFlow(
  {
    name: 'generateNewsReportFlow',
    inputSchema: GenerateNewsInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
