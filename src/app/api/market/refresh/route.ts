
'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { Player, User } from '@/lib/types';

const DAILY_MARKET_PATH = path.join(process.cwd(), 'src', 'data', 'daily_market.json');
const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

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
        const allOwnedPlayerIds = new Set(
            allUsers.flatMap(u => u.players.map(p => p.id))
        );

        const availablePlayers = ALL_PLAYERS.filter(p => !allOwnedPlayerIds.has(p.id));
        
        const finalRecommendations = new Set<Player>();

        function addPlayersToSet(players: Player[], count: number) {
            const shuffled = shuffleArray([...players]);
            for(let i=0; i < shuffled.length && finalRecommendations.size < count; i++) {
                const player = shuffled[i];
                if (!finalRecommendations.has(player)) {
                    finalRecommendations.add(player);
                }
            }
        }
    
        const highCostPlayers = availablePlayers.filter(p => p.cost >= 4000);
        const midCostPlayers = availablePlayers.filter(p => p.cost >= 3000 && p.cost < 4000);
        const lowCostPlayers = availablePlayers.filter(p => p.cost < 3000);
    
        const highRankPlayers = availablePlayers.filter(p => (p.rank || 9999) >= 1 && (p.rank || 9999) <= 200);
        const midRankPlayers = availablePlayers.filter(p => (p.rank || 9999) >= 201 && (p.rank || 9999) <= 500);
        const anyRankPlayers = availablePlayers;
    
        addPlayersToSet(highRankPlayers, 3);
        addPlayersToSet(midRankPlayers, 6);
        addPlayersToSet(anyRankPlayers, 9);
        addPlayersToSet(highCostPlayers, 12);
        addPlayersToSet(midCostPlayers, 15);
        addPlayersToSet(lowCostPlayers, 18);
        
        addPlayersToSet(availablePlayers, 18);

        const newMarketPlayers = Array.from(finalRecommendations);

        // Save the new market to the JSON file
        await fs.writeFile(DAILY_MARKET_PATH, JSON.stringify(newMarketPlayers, null, 2), 'utf-8');

        // Clear all bids for all users
        const usersToUpdate = allUsers.map(user => ({
            ...user,
            bids: {}
        }));
        await Promise.all(usersToUpdate.map(user => updateUser(user)));

        return NextResponse.json({ message: 'Daily market refreshed successfully', newMarket: newMarketPlayers });

    } catch (error) {
        console.error('Failed to refresh daily market:', error);
        return NextResponse.json({ message: 'Error refreshing market' }, { status: 500 });
    }
}
