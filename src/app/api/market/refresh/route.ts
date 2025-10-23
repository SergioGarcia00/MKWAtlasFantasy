'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { Player, User } from '@/lib/types';

const DAILY_MARKET_PATH = path.join(process.cwd(), 'src', 'data', 'daily_market.json');
const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

async function getAllUsers(): Promise<User[]> {
  try {
    const filenames = await fs.readdir(USERS_DIR);
    const users = await Promise.all(
      filenames.map(async (filename) => {
        if (filename.endsWith('.json')) {
          const content = await fs.readFile(path.join(USERS_DIR, filename), 'utf-8');
          return JSON.parse(content) as User;
        }
        return null;
      })
    );
    return users.filter((u): u is User => u !== null);
  } catch (error) {
    console.error("Failed to read user files:", error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const allUsers = await getAllUsers();
    const allOwnedPlayerIds = new Set(allUsers.flatMap(u => u.players.map(p => p.id)));

    // Filter out players who are already owned by any user
    const availablePlayers = ALL_PLAYERS.filter(p => !allOwnedPlayerIds.has(p.id));
    
    // Simple shuffle and pick logic
    const shuffled = availablePlayers.sort(() => 0.5 - Math.random());
    const newMarketPlayers = shuffled.slice(0, 15);

    await fs.writeFile(DAILY_MARKET_PATH, JSON.stringify(newMarketPlayers, null, 2), 'utf-8');

    // Also, clear all bids from all users
    for (const user of allUsers) {
        user.bids = {};
        const userFilePath = path.join(USERS_DIR, `${user.id}.json`);
        await fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
    }

    return NextResponse.json({ message: 'Market refreshed successfully', newMarketCount: newMarketPlayers.length });
  } catch (error: any) {
    console.error('Failed to refresh market:', error);
    return NextResponse.json({ message: `Error refreshing market: ${error.message}` }, { status: 500 });
  }
}
