'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { RosterTeam } from '@/lib/types';

const ROSTER_DATA_PATH = path.join(process.cwd(), 'src', 'lib', 'rosters_actualizado.json');

// This function applies a random multiplier between -10% and +10% to the MMR
const randomizeMmr = (mmr: number): number => {
    // Random multiplier between -0.10 and +0.10
    const multiplier = (Math.random() * 0.20) - 0.10; 
    const newMmr = Math.round(mmr * (1 + multiplier));
    // Ensure MMR stays within a reasonable range, e.g., 1000 to 13000
    return Math.max(1000, Math.min(newMmr, 13000));
};

export async function POST(request: Request) {
  try {
    const fileContent = await fs.readFile(ROSTER_DATA_PATH, 'utf-8');
    const rosterData: RosterTeam[] = JSON.parse(fileContent);

    const updatedRosterData = rosterData.map(team => ({
      ...team,
      players: team.players.map(player => {
        if (player.mmr) {
          return { ...player, mmr: randomizeMmr(player.mmr) };
        }
        return player;
      }),
    }));

    await fs.writeFile(ROSTER_DATA_PATH, JSON.stringify(updatedRosterData, null, 2), 'utf-8');
    
    return NextResponse.json({ message: 'Player market updated successfully!' });
  } catch (error) {
    console.error('Failed to update player market:', error);
    return NextResponse.json({ message: 'Error updating player market' }, { status: 500 });
  }
}
