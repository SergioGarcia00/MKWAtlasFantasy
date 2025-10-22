'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { RosterTeam } from '@/lib/types';

const ROSTERS_PATH = path.join(process.cwd(), 'src', 'lib', 'rosters_actualizado.json');
const BIDS_CSV_PATH = path.join(process.cwd(), 'src', 'lib', 'oldBids', 'all_bids.csv');

const parseCsv = (content: string): Record<string, any>[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        // Handle cases where values might contain commas
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const row: Record<string, any> = {};
        for (let j = 0; j < headers.length; j++) {
            const key = headers[j];
            let value = values[j] ? values[j].trim().replace(/"/g, '') : '';
             // If the value is a number, parse it as such
            if (key === 'Bid Amount' && !isNaN(Number(value))) {
                 row[key] = Number(value);
            } else {
                 row[key] = value;
            }
        }
        rows.push(row);
    }
    return rows;
};


export async function POST(request: Request) {
    try {
        let bidsCsvContent;
        try {
            bidsCsvContent = await fs.readFile(BIDS_CSV_PATH, 'utf-8');
        } catch (error) {
            return NextResponse.json({ message: 'all_bids.csv not found in src/lib/oldBids. Please add the file to run this script.' }, { status: 404 });
        }

        const bids = parseCsv(bidsCsvContent);
        
        // Find the highest bid for each player by name
        const highestBidsByName: Record<string, number> = {};
        for (const bid of bids) {
            const playerName = bid['Player Name'];
            const bidAmount = bid['Bid Amount'];
            if (playerName && typeof bidAmount === 'number') {
                const normalizedName = playerName.toLowerCase();
                if (!highestBidsByName[normalizedName] || bidAmount > highestBidsByName[normalizedName]) {
                    highestBidsByName[normalizedName] = bidAmount;
                }
            }
        }

        const rosters: RosterTeam[] = JSON.parse(await fs.readFile(ROSTERS_PATH, 'utf-8'));
        let playersUpdatedCount = 0;

        // Update player costs
        for (const team of rosters) {
            for (const player of team.players) {
                 if (player.name) {
                    const normalizedPlayerName = player.name.toLowerCase();
                    if (highestBidsByName[normalizedPlayerName]) {
                        player.cost = highestBidsByName[normalizedPlayerName];
                        playersUpdatedCount++;
                    }
                 }
            }
        }

        await fs.writeFile(ROSTERS_PATH, JSON.stringify(rosters, null, 2), 'utf-8');

        return NextResponse.json({ 
            message: `Old bids applied successfully. Updated the cost of ${playersUpdatedCount} players.`
        });

    } catch (error: any) {
        console.error('Failed to apply old bids:', error);
        return NextResponse.json({ message: `Error applying old bids: ${error.message}` }, { status: 500 });
    }
}
