'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { Player, User, Bid } from '@/lib/types';

const DAILY_MARKET_PATH = path.join(process.cwd(), 'src', 'data', 'daily_market.json');
const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

async function readMarketFile(): Promise<Player[]> {
  try {
    const fileContent = await fs.readFile(DAILY_MARKET_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

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

export async function GET(request: Request) {
  try {
    const marketPlayers = await readMarketFile();
    const allUsers = await getAllUsers();
    
    // Create a map of all bids
    const allBidsByPlayer = allUsers.reduce<Record<string, Bid[]>>((acc, user) => {
        if (user.bids) {
            for (const [playerId, amount] of Object.entries(user.bids)) {
                if (!acc[playerId]) {
                    acc[playerId] = [];
                }
                acc[playerId].push({
                    userId: user.id,
                    userName: user.name,
                    amount: amount
                });
            }
        }
        return acc;
    }, {});


    const marketWithBids = marketPlayers.map(player => ({
      ...player,
      bids: allBidsByPlayer[player.id] || [],
    }));

    return NextResponse.json(marketWithBids, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: `Error reading market data: ${error.message}` }, { status: 500 });
  }
}
