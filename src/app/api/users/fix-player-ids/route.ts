'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { USER_IDS } from '@/data/users';
import { ALL_PLAYERS } from '@/data/players';
import type { User, Player } from '@/lib/types';
import playersData from '@/lib/rosters_actualizado.json';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

const allRosterPlayers = playersData.flatMap(team => team.players);

const createPlayerId = (player: any): string => {
  const name = player.name.replace(/\s+/g, '-');
  const peakMmr = player.peak_mmr || 0;
  const friendCode = player.friend_code || '0000';
  return `${name}-${peakMmr}-${friendCode.slice(-4)}`;
};

async function getUser(userId: string): Promise<User | null> {
    try {
        const filePath = path.join(USERS_DIR, `${userId}.json`);
        const userContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(userContent);
    } catch (error) {
        console.error(`Error reading user file ${userId}:`, error);
        return null;
    }
}

async function updateUser(user: User): Promise<void> {
    const userFilePath = path.join(USERS_DIR, `${user.id}.json`);
    await fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
}

// Function to find a roster player by a potentially outdated ID
const findRosterPlayerByOldId = (oldId: string): any | undefined => {
    // This is not efficient, but it's for a one-time fix.
    // It tries to find a match based on parts of the old ID.
    const oldIdParts = oldId.split('-');
    const namePart = oldIdParts.slice(0, -2).join('-');
    
    return allRosterPlayers.find(p => {
        const pName = p.name.replace(/\s+/g, '-');
        if (pName === namePart) return true;
        if (p.name.toLowerCase().includes(namePart.toLowerCase())) return true;
        return false;
    });
};


export async function POST(request: Request) {
    try {
        let playersFixedCount = 0;
        let usersProcessedCount = 0;

        for (const userId of USER_IDS) {
            const user = await getUser(userId);
            if (!user) continue;

            let userWasModified = false;

            // --- Fix user.players ---
            const fixedPlayers = user.players.map(p => {
                const rosterPlayer = findRosterPlayerByOldId(p.id);
                if (rosterPlayer) {
                    const newId = createPlayerId(rosterPlayer);
                    if (newId !== p.id) {
                        playersFixedCount++;
                        userWasModified = true;
                        return { ...p, id: newId };
                    }
                }
                return p;
            });
            user.players = fixedPlayers;

            // --- Fix user.roster.lineup ---
            const fixedLineup = user.roster.lineup.map(playerId => {
                const rosterPlayer = findRosterPlayerByOldId(playerId);
                if (rosterPlayer) {
                    const newId = createPlayerId(rosterPlayer);
                    if (newId !== playerId) {
                        userWasModified = true;
                        return newId;
                    }
                }
                return playerId;
            });
            user.roster.lineup = fixedLineup;
            
            // --- Fix user.roster.bench ---
            const fixedBench = user.roster.bench.map(playerId => {
                const rosterPlayer = findRosterPlayerByOldId(playerId);
                if (rosterPlayer) {
                    const newId = createPlayerId(rosterPlayer);
                     if (newId !== playerId) {
                        userWasModified = true;
                        return newId;
                    }
                }
                return playerId;
            });
            user.roster.bench = fixedBench;

            // --- Fix user.bids ---
            const fixedBids: Record<string, number> = {};
            for (const oldPlayerId in user.bids) {
                const rosterPlayer = findRosterPlayerByOldId(oldPlayerId);
                 if (rosterPlayer) {
                    const newId = createPlayerId(rosterPlayer);
                    fixedBids[newId] = user.bids[oldPlayerId];
                    if(newId !== oldPlayerId) userWasModified = true;
                } else {
                    fixedBids[oldPlayerId] = user.bids[oldPlayerId];
                }
            }
            user.bids = fixedBids;


            if (userWasModified) {
                await updateUser(user);
                usersProcessedCount++;
            }
        }

        return NextResponse.json({ 
            message: `Process complete. Fixed ${playersFixedCount} player ID references across ${usersProcessedCount} users.`
        });

    } catch (error) {
        console.error('Failed to fix player IDs:', error);
        return NextResponse.json({ message: 'Error fixing player IDs' }, { status: 500 });
    }
}
