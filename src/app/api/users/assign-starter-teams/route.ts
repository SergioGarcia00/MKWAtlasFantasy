'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { Player, User, UserPlayer } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');
const TEAM_SIZE = 6;

// Helper to shuffle an array
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

async function getAllUsers(): Promise<User[]> {
    const userFiles = await fs.readdir(USERS_DIR);
    const users: User[] = [];
    for (const file of userFiles) {
        if (file.endsWith('.json')) {
            const filePath = path.join(USERS_DIR, file);
            const userContent = await fs.readFile(filePath, 'utf-8');
            users.push(JSON.parse(userContent));
        }
    }
    return users;
}

async function updateUser(user: User): Promise<void> {
    const userFilePath = path.join(USERS_DIR, `${user.id}.json`);
    await fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
}

export async function POST(request: Request) {
    try {
        const allUsers = await getAllUsers();
        
        // Reset all user rosters first
        for (const user of allUsers) {
            user.players = [];
            user.roster = { lineup: [], bench: [] };
        }

        // Shuffle all available players
        let availablePlayers = shuffleArray([...ALL_PLAYERS]);

        if (availablePlayers.length < allUsers.length * TEAM_SIZE) {
             return NextResponse.json({ message: 'Not enough players in the database to assign a full team to every user.' }, { status: 500 });
        }

        // Perform a "snake draft"
        for (let i = 0; i < TEAM_SIZE; i++) {
            const isReverse = i % 2 !== 0;
            const usersOrder = isReverse ? [...allUsers].reverse() : allUsers;

            for (const user of usersOrder) {
                if (availablePlayers.length > 0) {
                    const player = availablePlayers.pop()!;
                    const userPlayer: UserPlayer = { id: player.id, purchasedAt: Date.now() };
                    
                    const targetUser = allUsers.find(u => u.id === user.id)!;
                    targetUser.players.push(userPlayer);
                    targetUser.roster.lineup.push(player.id);
                }
            }
        }
        
        // Save all user files after all assignments are done
        await Promise.all(allUsers.map(user => updateUser(user)));

        return NextResponse.json({ message: `Starter teams assigned successfully to ${allUsers.length} users.` });

    } catch (error) {
        console.error('Failed to assign starter teams:', error);
        return NextResponse.json({ message: 'Error assigning starter teams' }, { status: 500 });
    }
}
