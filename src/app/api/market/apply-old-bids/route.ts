'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { RosterTeam } from '@/lib/types';

// Path to the main player data file
const ROSTERS_PATH = path.join(process.cwd(), 'src', 'lib', 'rosters_actualizado.json');
// Path to the CSV with old bids
const BIDS_CSV_PATH = path.join(process.cwd(), 'src', 'lib', 'oldBids', 'all_bids.csv');


// Helper function to parse CSV content
const parseCsv = (content: string): Record<string, any>[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row: Record<string, any> = {};
        for (let j = 0; j < headers.length; j++) {
            const key = headers[j];
            const value = values[j] ? values[j].trim().replace(/"/g, '') : '';
            row[key] = isNaN(Number(value)) ? value : Number(value);
        }
        rows.push(row);
    }
    return rows;
};


export async function POST(request: Request) {
    try {
        // --- 1. Read and parse the bids CSV ---
        let bidsCsvContent;
        try {
            bidsCsvContent = await fs.readFile(BIDS_CSV_PATH, 'utf-8');
        } catch (error) {
            return NextResponse.json({ message: 'all_bids.csv not found in src/lib/oldBids. Please add the file to run this script.' }, { status: 404 });
        }

        const bids = parseCsv(bidsCsvContent);
        
        // --- 2. Find the highest bid for each player ---
        const highestBids: Record<string, number> = {};
        for (const bid of bids) {
            const playerId = bid['Player ID'];
            const bidAmount = bid['Bid Amount'];
            if (playerId && typeof bidAmount === 'number') {
                if (!highestBids[playerId] || bidAmount > highestBids[playerId]) {
                    highestBids[playerId] = bidAmount;
                }
            }
        }

        // --- 3. Read the rosters file ---
        const rosters: RosterTeam[] = JSON.parse(await fs.readFile(ROSTERS_PATH, 'utf-8'));
        let playersUpdatedCount = 0;

        // --- 4. Update player costs ---
        for (const team of rosters) {
            for (const player of team.players) {
                 if (player.id && highestBids[player.id]) {
                    player.cost = highestBids[player.id];
                    playersUpdatedCount++;
                }
            }
        }

        // --- 5. Write the updated data back ---
        await fs.writeFile(ROSTERS_PATH, JSON.stringify(rosters, null, 2), 'utf-8');

        return NextResponse.json({ 
            message: `Old bids applied successfully. Updated the cost of ${playersUpdatedCount} players.`
        });

    } catch (error: any) {
        console.error('Failed to apply old bids:', error);
        return NextResponse.json({ message: `Error applying old bids: ${error.message}` }, { status: 500 });
    }
}
