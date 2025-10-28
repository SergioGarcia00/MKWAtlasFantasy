'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { User, WeeklyScore } from '@/lib/types';
import { ALL_PLAYERS } from '@/data/players';
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

export async function POST(request: Request, { params }: { params: { userId: string } }) {
    try {
        const { userId } = params;
        const { playerId, weekId, scores } = await request.json() as { playerId: string; weekId: string; scores: WeeklyScore };

        if (!userId || !playerId || !weekId || scores === undefined) {
            return NextResponse.json({ message: 'User ID, Player ID, Week ID, and scores are required' }, { status: 400 });
        }
        
        const user = await getUser(userId);

        if (!user.weeklyScores) {
            user.weeklyScores = {};
        }
        if (!user.weeklyScores[playerId]) {
            user.weeklyScores[playerId] = {};
        }
        
        user.weeklyScores[playerId][weekId] = scores;

        await saveUser(user);

        const totalScore = (scores.race1 || 0) + (scores.race2 || 0);
        if (totalScore > 150) { // Threshold for a high score worth announcing
            const playerName = ALL_PLAYERS.find(p => p.id === playerId)?.name || 'A player';
            if (totalScore > 250) {
                 await addNewsItem('news.massive_score', [playerName, user.name, totalScore, weekId], '🔥');
            } else {
                 await addNewsItem('news.high_score', [playerName, user.name, totalScore, weekId], '🔥');
            }
        }

        return NextResponse.json({ message: 'Scores updated successfully', user });

    } catch (error: any) {
        console.error('Failed to update scores:', error);
        return NextResponse.json({ message: `Error updating scores: ${error.message}` }, { status: 500 });
    }
}
