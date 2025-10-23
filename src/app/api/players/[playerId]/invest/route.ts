'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { User } from '@/lib/types';

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
        const { userId, amount } = await request.json();

        if (!userId || !amount) {
            return NextResponse.json({ message: 'User ID and investment amount are required' }, { status: 400 });
        }
        if (amount <= 0) {
            return NextResponse.json({ message: 'Investment amount must be positive' }, { status: 400 });
        }

        const user = await getUser(userId);
        
        if (user.currency < amount) {
            return NextResponse.json({ message: 'Insufficient funds' }, { status: 400 });
        }

        const playerToUpdate = user.players.find(p => p.id === playerId);
        if (!playerToUpdate) {
            return NextResponse.json({ message: 'Player not found in user roster' }, { status: 404 });
        }

        // Update player's investment and user's currency
        playerToUpdate.clauseInvestment = (playerToUpdate.clauseInvestment || 0) + amount;
        user.currency -= amount;
        
        await saveUser(user);

        return NextResponse.json({ message: 'Investment successful', user });

    } catch (error: any) {
        console.error('Failed to invest in player:', error);
        return NextResponse.json({ message: `Error investing in player: ${error.message}` }, { status: 500 });
    }
}
