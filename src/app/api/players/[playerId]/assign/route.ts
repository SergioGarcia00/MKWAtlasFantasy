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
        const { targetUserId, currentOwnerId } = await request.json();

        if (!targetUserId) {
            return NextResponse.json({ message: 'Target User ID is required' }, { status: 400 });
        }

        const playerToAssign = ALL_PLAYERS.find(p => p.id === playerId);
        if (!playerToAssign) {
            return NextResponse.json({ message: 'Player not found' }, { status: 404 });
        }

        const targetUser = await getUser(targetUserId);

        if (targetUser.players.length >= 10) {
            return NextResponse.json({ message: `${targetUser.name}'s roster is full.` }, { status: 400 });
        }

        // --- Transaction ---

        // 1. Remove from current owner if they exist
        if (currentOwnerId) {
            const currentOwner = await getUser(currentOwnerId);
            const playerIndex = currentOwner.players.findIndex(p => p.id === playerId);
            if (playerIndex > -1) {
                currentOwner.players.splice(playerIndex, 1);
                currentOwner.roster.lineup = currentOwner.roster.lineup.filter(id => id !== playerId);
                currentOwner.roster.bench = currentOwner.roster.bench.filter(id => id !== playerId);
                await saveUser(currentOwner);
            }
        }
        
        // 2. Add to target user
        if (!targetUser.players.some(p => p.id === playerId)) {
             const newUserPlayer: UserPlayer = {
                id: playerId,
                purchasedAt: Date.now(),
                purchasePrice: playerToAssign.cost, // Assigned for free, but log base cost as purchase price
                clauseInvestment: 0
            };
            targetUser.players.push(newUserPlayer);
             if (!targetUser.roster.bench.includes(playerId)) {
                targetUser.roster.bench.push(playerId);
            }
            await saveUser(targetUser);
        }

        return NextResponse.json({ message: `${playerToAssign.name} assigned to ${targetUser.name}` });

    } catch (error: any) {
        console.error('Failed to assign player:', error);
        return NextResponse.json({ message: `Error assigning player: ${error.message}` }, { status: 500 });
    }
}
