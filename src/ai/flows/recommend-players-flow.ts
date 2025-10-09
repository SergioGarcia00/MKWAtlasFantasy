'use server';
/**
 * @fileOverview Flow to recommend players to a user.
 *
 * - getPlayerRecommendations - A function that returns a list of recommended players.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { User, Player } from '@/lib/types';
import { ALL_PLAYERS } from '@/data/players';
import { userSchema, playerSchema } from '@/ai/schemas';

const RecommendPlayersInputSchema = z.object({
  user: userSchema,
});

const RecommendPlayersOutputSchema = z.array(playerSchema);

export async function getPlayerRecommendations(
  input: z.infer<typeof RecommendPlayersInputSchema>
): Promise<Player[]> {
  const recommendedPlayerNames = await recommendPlayersFlow(input);

  // Filter ALL_PLAYERS to find the full player objects for the recommended players
  const recommendedPlayers = ALL_PLAYERS.filter((player) =>
    recommendedPlayerNames.some((p) => p.name === player.name)
  );

  return recommendedPlayers;
}

const recommendPlayersFlow = ai.defineFlow(
  {
    name: 'recommendPlayersFlow',
    inputSchema: RecommendPlayersInputSchema,
    outputSchema: z.array(z.object({ name: z.string() })),
  },
  async ({ user }) => {
    const ownedPlayerNames = user.players.map((p) => p.name).join(', ');
    const allPlayerNames = ALL_PLAYERS.map((p) => p.name).join(', ');

    const { output } = await ai.generate({
      prompt: `Un usuario de una liga de fantasía de Mario Kart necesita recomendaciones de jugadores.

      Presupuesto del usuario: ${user.currency} monedas.
      Jugadores que ya posee: ${ownedPlayerNames || 'Ninguno'}.
      
      Jugadores disponibles en la tienda:
      ${allPlayerNames}
      
      Analiza los jugadores disponibles y recomienda los 3 mejores que el usuario podría comprar. Las recomendaciones deben ser jugadores que el usuario no posea y que pueda permitirse. Prioriza jugadores con buen rendimiento (alto MMR) pero que ofrezcan un buen valor por su coste.
      
      Devuelve solo los nombres de los 3 jugadores recomendados.`,
      output: {
        schema: z.array(z.object({ name: z.string() })),
      },
    });
    return output!;
  }
);
