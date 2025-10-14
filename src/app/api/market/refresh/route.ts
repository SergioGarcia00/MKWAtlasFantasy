
'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { USER_IDS } from '@/data/users';

// This endpoint is now less critical as the main market GET is dynamic.
// It can be repurposed for more complex logic later, like forced-clearing of bids if needed.
// For now, it will just clear all bids as it did before.

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

async function getAllUsers() {
    const users = [];
    for (const id of USER_IDS) {
        try {
            const filePath = path.join(USERS_DIR, `${id}.json`);
            const userContent = await fs.readFile(filePath, 'utf-8');
            users.push(JSON.parse(userContent));
        } catch (e) {
             console.error(`Could not read user file for ${id}, skipping. Error:`, e);
        }
    }
    return users;
}

export async function POST(request: Request) {
    try {
        const allUsers = await getAllUsers();
        
        // Clear all bids for all users
        for (const user of allUsers) {
            user.bids = {};
            const userFilePath = path.join(USERS_DIR, `${user.id}.json`);
            await fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
        }

        return NextResponse.json({ message: 'Bids cleared and market is dynamically refreshed.' });

    } catch (error) {
        console.error('Failed to refresh daily market:', error);
        return NextResponse.json({ message: 'Error refreshing market' }, { status: 500 });
    }
}
