'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { User, Player, UserPlayer } from '@/lib/types';

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

        const player = ALL_PLAYERS.find(p => p.id === playerId);
        if (!player) {
            return NextResponse.json({ message: 'Player not found' }, { status: 404 });
        }

        const user = await getUser(userId);

        if (user.currency < player.cost) {
            return NextResponse.json({ message: 'Insufficient funds' }, { status: 400 });
        }
        if (user.players.length >= 10) {
            return NextResponse.json({ message: 'Roster is full. Cannot purchase more than 10 players.' }, { status: 400 });
        }
        if (user.players.some(p => p.id === playerId)) {
             return NextResponse.json({ message: 'Player already owned' }, { status: 400 });
        }

        // Deduct cost and add player
        user.currency -= player.cost;
        const newUserPlayer: UserPlayer = { 
            id: player.id, 
            purchasedAt: Date.now(),
            purchasePrice: player.cost 
        };
        user.players.push(newUserPlayer);

        // Add to bench by default
        if (!user.roster.bench.includes(player.id) && !user.roster.lineup.includes(player.id)) {
            user.roster.bench.push(player.id);
        }

        await saveUser(user);

        return NextResponse.json({ message: 'Player purchased successfully', user });

    } catch (error: any) {
        console.error('Failed to purchase player:', error);
        return NextResponse.json({ message: `Error purchasing player: ${error.message}` }, { status: 500 });
    }
}
