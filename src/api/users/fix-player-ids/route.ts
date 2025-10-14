'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { USER_IDS } from '@/data/users';
import { ALL_PLAYERS } from '@/data/players';
import type { User, Player } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

// Create a map for quick lookups of new IDs based on old identifying parts
const playerMapByName = new Map<string, Player>();
ALL_PLAYERS.forEach(p => {
    // A simplified name key for broader matching
    const nameKey = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!playerMapByName.has(nameKey)) {
        playerMapByName.set(nameKey, p);
    }
});

// A more specific map for cases where name is not unique enough
const playerMapByPeakMmr = new Map<string, Player>();
ALL_PLAYERS.forEach(p => {
    if (p.peak_mmr) {
         playerMapByPeakMmr.set(`${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${p.peak_mmr}`, p);
    }
});


const getCorrectPlayerId = (oldId: string): string | undefined => {
    // Try to find a direct match first
    const directMatch = ALL_PLAYERS.find(p => p.id === oldId);
    if (directMatch) return directMatch.id;

    // Fallback logic for old, inconsistent IDs
    const oldIdParts = oldId.split('-');
    const oldName = oldIdParts.slice(0, -2).join('-').toLowerCase().replace(/[^a-z0-9]/g, '');
    const oldMmr = oldIdParts[oldIdParts.length-2];

    // Try matching by name and peak_mmr first
    const peakMmrMatch = playerMapByPeakMmr.get(`${oldName}-${oldMmr}`);
    if (peakMmrMatch) {
        return peakMmrMatch.id;
    }
    
    // Then try a more general name match
    const nameMatch = playerMapByName.get(oldName);
    if (nameMatch) {
        return nameMatch.id;
    }

    // Try a simple name match for IDs that might just be the name
    const simpleNameMatch = ALL_PLAYERS.find(p => p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === oldId.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (simpleNameMatch) return simpleNameMatch.id;


    return undefined; // No match found
};


export async function POST(request: Request) {
    try {
        let playersFixedCount = 0;
        let usersProcessedCount = 0;

        for (const userId of USER_IDS) {
            const userFilePath = path.join(USERS_DIR, `${userId}.json`);
            let user: User;
            try {
                const userContent = await fs.readFile(userFilePath, 'utf-8');
                user = JSON.parse(userContent);
            } catch (error) {
                console.warn(`Could not read user file ${userId}. Skipping.`);
                continue;
            }

            let userWasModified = false;

            const fixId = (oldId: string) => {
                const newId = getCorrectPlayerId(oldId);
                if (newId && newId !== oldId) {
                    playersFixedCount++;
                    userWasModified = true;
                    return newId;
                }
                return oldId;
            };

            // --- Fix user.players ---
            user.players = user.players.map(p => ({ ...p, id: fixId(p.id) }));

            // --- Fix user.roster.lineup & bench ---
            user.roster.lineup = user.roster.lineup.map(fixId);
            user.roster.bench = user.roster.bench.map(fixId);
            
            // --- Fix user.bids ---
            const fixedBids: Record<string, number> = {};
            if(user.bids) {
                for (const oldPlayerId in user.bids) {
                    const newId = getCorrectPlayerId(oldPlayerId) || oldPlayerId;
                    if (newId !== oldPlayerId) userWasModified = true;
                    fixedBids[newId] = user.bids[oldPlayerId];
                }
                user.bids = fixedBids;
            }

             // --- Fix user.weeklyScores ---
            const fixedWeeklyScores: Record<string, Record<string, any>> = {};
            if(user.weeklyScores) {
                for (const oldPlayerId in user.weeklyScores) {
                    const newId = getCorrectPlayerId(oldPlayerId) || oldPlayerId;
                    if (newId !== oldPlayerId) userWasModified = true;
                    fixedWeeklyScores[newId] = user.weeklyScores[oldPlayerId];
                }
                user.weeklyScores = fixedWeeklyScores;
            }

            if (userWasModified) {
                await fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
                usersProcessedCount++;
            }
        }

        return NextResponse.json({ 
            message: `Process complete. Fixed ${playersFixedCount} player ID references across ${usersProcessedCount} distinct users.`
        });

    } catch (error: any) {
        console.error('Failed to fix player IDs:', error);
        return NextResponse.json({ message: `Error fixing player IDs: ${error.message}` }, { status: 500 });
    }
}
