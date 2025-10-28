'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { USER_IDS } from '@/data/users';
import type { User } from '@/lib/types';
import { addNewsItem } from '@/lib/news-helpers';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

async function getAllUsers(): Promise<User[]> {
    const users = await Promise.all(
        USER_IDS.map(async (id) => {
            const filePath = path.join(USERS_DIR, `${id}.json`);
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                return JSON.parse(content) as User;
            } catch (error) {
                console.warn(`Could not read user file for ${id}. Skipping.`);
                return null;
            }
        })
    );
    return users.filter((u): u is User => u !== null);
}

async function saveUser(user: User): Promise<void> {
    const filePath = path.join(USERS_DIR, `${user.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(user, null, 2), 'utf-8');
}

export async function POST(request: Request) {
    try {
        const { weekId } = await request.json();
        if (!weekId) {
            return NextResponse.json({ message: 'Week ID is required' }, { status: 400 });
        }

        const allUsers = await getAllUsers();
        let totalPayout = 0;
        let usersPaid = 0;
        const payoutDetails = [];

        for (const user of allUsers) {
            const lineup = user.roster?.lineup || [];
            if (lineup.length === 0) continue;

            let weeklyScore = 0;
            for (const playerId of lineup) {
                const playerScoreForWeek = user.weeklyScores?.[playerId]?.[weekId];
                if (playerScoreForWeek) {
                    weeklyScore += (playerScoreForWeek.race1 || 0) + (playerScoreForWeek.race2 || 0);
                }
            }

            if (weeklyScore > 0) {
                const payoutAmount = Math.floor(weeklyScore / 2);
                user.currency += payoutAmount;
                totalPayout += payoutAmount;
                usersPaid++;
                payoutDetails.push(`${user.name} earned ${payoutAmount.toLocaleString()} coins for a score of ${weeklyScore}.`);
                await saveUser(user);
            }
        }
        
        const message = `Weekly payout for Week ${weekId} complete. ${totalPayout.toLocaleString()} coins distributed to ${usersPaid} users.`;
        
        await addNewsItem('news.payout', [weekId, totalPayout.toLocaleString(), usersPaid], '💸');

        return NextResponse.json({ message, details: payoutDetails });

    } catch (error: any) {
        console.error('Failed to process weekly payout:', error);
        return NextResponse.json({ message: `Error processing payout: ${error.message}` }, { status: 500 });
    }
}
