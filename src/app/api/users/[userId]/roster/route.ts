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

export async function POST(request: Request, { params }: { params: { userId: string } }) {
    try {
        const { userId } = params;
        const { lineup, bench } = await request.json();

        if (!userId) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }
        if (!Array.isArray(lineup) || !Array.isArray(bench)) {
             return NextResponse.json({ message: 'Lineup and bench must be arrays' }, { status: 400 });
        }

        const user = await getUser(userId);
        
        user.roster = { lineup, bench };
        
        await saveUser(user);

        return NextResponse.json({ message: 'Roster updated successfully', user });

    } catch (error: any) {
        console.error('Failed to update roster:', error);
        return NextResponse.json({ message: `Error updating roster: ${error.message}` }, { status: 500 });
    }
}
