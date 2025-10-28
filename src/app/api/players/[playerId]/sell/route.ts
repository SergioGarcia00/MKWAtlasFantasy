'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { User, UserPlayer } from '@/lib/types';
import { addNewsItem } from '@/lib/news-helpers';


const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

async function getUser(userId: string): Promise<User> {
    const filePath = path.join(USERS_DIR, `${userId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
}

async function saveUser(user: User): Promise<void> {
    const filePath = path.join(USERS_DIR, `${user.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(user, null, 2), 'utf-8');
}

export async function POST(request: Request, { params }: { params: { playerId: string } }) {
    try {
        const { playerId } = params;
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }

        const user = await getUser(userId);
        
        const playerIndex = user.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            return NextResponse.json({ message: 'Player not owned by user' }, { status: 400 });
        }
        
        const playerToSell = user.players[playerIndex];
        const playerInfo = ALL_PLAYERS.find(p => p.id === playerId);
        // Fallback to player's base cost if purchasePrice is missing or not a number
        const sellPrice = (typeof playerToSell.purchasePrice === 'number' && !isNaN(playerToSell.purchasePrice))
            ? playerToSell.purchasePrice
            : playerInfo?.cost || 0;

        // Add currency and remove player
        user.currency += sellPrice;
        user.players.splice(playerIndex, 1);

        // Remove from roster
        user.roster.lineup = user.roster.lineup.filter(id => id !== playerId);
        user.roster.bench = user.roster.bench.filter(id => id !== playerId);
        
        await saveUser(user);

        // Add news item
        await addNewsItem('news.sell', [user.name, playerInfo?.name || 'a player', sellPrice.toLocaleString()]);

        return NextResponse.json({ message: 'Player sold successfully', user });

    } catch (error: any) {
        console.error('Failed to sell player:', error);
        return NextResponse.json({ message: `Error selling player: ${error.message}` }, { status: 500 });
    }
}
