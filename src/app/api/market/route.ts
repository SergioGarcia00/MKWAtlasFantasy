
'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { Player, User } from '@/lib/types';
import { USER_IDS } from '@/data/users';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

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

export async function GET(request: Request) {
    try {
        const allUsers = await getAllUsers();
        const allOwnedPlayerIds = new Set(allUsers.flatMap(u => u.players.map(p => p.id)));
        const availablePlayers = ALL_PLAYERS.filter(p => !allOwnedPlayerIds.has(p.id));

        const shuffledAvailablePlayers = shuffleArray(availablePlayers);
        
        // Take a slice of players for the market, for example, 18 players
        const marketPlayers = shuffledAvailablePlayers.slice(0, 18);

        return NextResponse.json(marketPlayers);
    } catch (error) {
        console.error('Failed to generate daily market data:', error);
        return NextResponse.json({ message: 'Error generating market data' }, { status: 500 });
    }
}
