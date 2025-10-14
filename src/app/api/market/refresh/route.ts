
'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { USER_IDS } from '@/data/users';
import { ALL_PLAYERS } from '@/data/players';
import type { User, Player } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');
const DAILY_MARKET_PATH = path.join(process.cwd(), 'src', 'data', 'daily_market.json');

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

async function getAllUsers(): Promise<User[]> {
    const users: User[] = [];
    for (const id of USER_IDS) {
        try {
            const filePath = path.join(USERS_DIR, `${id}.json`);
            const userContent = await fs.readFile(filePath, 'utf-8');
            users.push(JSON.parse(userContent));
        } catch (error) {
            console.error(`Could not read user file for ${id}, skipping. Error:`, error);
        }
    }
    return users;
}

export async function POST(request: Request) {
    try {
        // --- 1. Clear all bids for all users ---
        const allUsers = await getAllUsers();
        for (const user of allUsers) {
            user.bids = {};
            const userFilePath = path.join(USERS_DIR, `${user.id}.json`);
            await fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
        }

        // --- 2. Generate a new market ---
        const allOwnedPlayerIds = new Set(allUsers.flatMap(u => u.players.map(p => p.id)));
        const availablePlayers = ALL_PLAYERS.filter(p => !allOwnedPlayerIds.has(p.id));

        const shuffledAvailablePlayers = shuffleArray(availablePlayers);
        
        // Take a slice of players for the market, for example, 18 players
        const marketPlayers = shuffledAvailablePlayers.slice(0, 18);
        
        // --- 3. Overwrite the daily_market.json file ---
        await fs.writeFile(DAILY_MARKET_PATH, JSON.stringify(marketPlayers, null, 2), 'utf-8');


        return NextResponse.json({ message: 'Market regenerated and bids cleared successfully.' });

    } catch (error) {
        console.error('Failed to refresh daily market:', error);
        return NextResponse.json({ message: 'Error refreshing market' }, { status: 500 });
    }
}
