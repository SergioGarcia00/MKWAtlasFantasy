'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { RosterTeam } from '@/lib/types';

const ROSTER_DATA_PATH = path.join(process.cwd(), 'src', 'lib', 'rosters_actualizado.json');

// This function applies a random multiplier between -10% and +10% to the cost
const randomizeCost = (cost: number): number => {
    // Random multiplier between -0.10 and +0.10
    const multiplier = (Math.random() * 0.20) - 0.10; 
    const newCost = Math.round(cost * (1 + multiplier));
    // Ensure cost stays within a reasonable range, e.g., 1000 to 7500
    return Math.max(1000, Math.min(newCost, 7500));
};

// This function calculates cost based on MMR, used if cost doesn't exist
const generateCost = (peak_mmr: number = 5000) => {
  return 1500 + Math.round((Math.max(1, Math.min(peak_mmr, 12000)) / 12000) * 3500);
};

export async function POST(request: Request) {
  try {
    const fileContent = await fs.readFile(ROSTER_DATA_PATH, 'utf-8');
    const rosterData: RosterTeam[] = JSON.parse(fileContent);

    const updatedRosterData = rosterData.map(team => ({
      ...team,
      players: team.players.map(player => {
        // If player has a cost, randomize it. Otherwise, generate it from peak MMR.
        const currentCost = player.cost || generateCost(player.peak_mmr);
        return { ...player, cost: randomizeCost(currentCost) };
      }),
    }));

    await fs.writeFile(ROSTER_DATA_PATH, JSON.stringify(updatedRosterData, null, 2), 'utf-8');
    
    return NextResponse.json({ message: 'Player market updated successfully!' });
  } catch (error) {
    console.error('Failed to update player market:', error);
    return NextResponse.json({ message: 'Error updating player market' }, { status: 500 });
  }
}
