'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { Player, RosterTeam } from '@/lib/types';

const ROSTERS_PATH = path.join(process.cwd(), 'src', 'lib', 'rosters_actualizado.json');

export async function POST(request: Request) {
    try {
        const rosters: RosterTeam[] = JSON.parse(await fs.readFile(ROSTERS_PATH, 'utf-8'));

        const updatedRosters = rosters.map(team => ({
            ...team,
            players: team.players.map(player => {
                if (player.peak_mmr) {
                    const originalCost = player.peak_mmr;
                    // Apply a random variation between -10% and +10%
                    const variation = (Math.random() * 0.20) - 0.10; // -0.10 to +0.10
                    const newCost = Math.round(originalCost * (1 + variation));

                    return { ...player, cost: newCost };
                }
                return player;
            })
        }));

        await fs.writeFile(ROSTERS_PATH, JSON.stringify(updatedRosters, null, 2), 'utf-8');

        return NextResponse.json({ message: 'Player prices recalculated successfully' });

    } catch (error) {
        console.error('Failed to recalculate player prices:', error);
        return NextResponse.json({ message: 'Error recalculating prices' }, { status: 500 });
    }
}
