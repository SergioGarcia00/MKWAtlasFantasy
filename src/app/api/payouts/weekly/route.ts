'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { User, WeeklyScore } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

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

const getPlayerScoresForWeek = (user: User, playerId: string, weekId: string): WeeklyScore => {
    return user.weeklyScores?.[playerId]?.[weekId] || { race1: 0, race2: 0 };
}

const calculateLineupScoreForWeek = (user: User, weekId: string): number => {
  if (!user.roster || !user.roster.lineup) return 0;
  
  return user.roster.lineup.reduce((total: number, playerId: string) => {
    const scores = getPlayerScoresForWeek(user, playerId, weekId);
    return total + (scores?.race1 || 0) + (scores?.race2 || 0);
  }, 0);
};

export async function POST(request: Request) {
    try {
        const { weekId } = await request.json();

        if (!weekId) {
            return NextResponse.json({ message: 'Week ID is required' }, { status: 400 });
        }

        const allUsers = await getAllUsers();
        let usersUpdatedCount = 0;

        const updatedUsers = allUsers.map(user => {
            const weeklyScore = calculateLineupScoreForWeek(user, weekId);
            const payout = Math.floor(weeklyScore / 2);
            
            if (payout > 0) {
                usersUpdatedCount++;
                return {
                    ...user,
                    currency: user.currency + payout,
                };
            }
            return user;
        });

        await Promise.all(updatedUsers.map(user => updateUser(user)));

        return NextResponse.json({ 
            message: `Payout for Week ${weekId} distributed to ${usersUpdatedCount} users.`,
        });

    } catch (error) {
        console.error('Failed to process weekly payout:', error);
        return NextResponse.json({ message: 'Error processing weekly payout' }, { status: 500 });
    }
}
