
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import { USER_IDS } from '@/data/users';
import type { User, Player } from '@/lib/types';

const USERS_DATA_DIR = path.join(process.cwd(), 'src', 'data', 'users');

const hydrateUser = (user: any): User => {
    const playerIdsToObjects = new Map(ALL_PLAYERS.map(p => [p.id, p]));

    const hydratePlayerArray = (arr: (string | Player)[]): Player[] =>
        (arr || []).map(p => (typeof p === 'string' ? playerIdsToObjects.get(p) : p))
           .filter((p): p is Player => p !== undefined);

    return {
        ...user,
        players: hydratePlayerArray(user.players),
        roster: {
            lineup: hydratePlayerArray(user.roster?.lineup),
            bench: hydratePlayerArray(user.roster?.bench),
        },
    };
};

export async function GET(request: Request) {
  try {
    const users = await Promise.all(
      USER_IDS.map(async (userId) => {
        const filePath = path.join(USERS_DATA_DIR, `${userId}.json`);
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const user = JSON.parse(fileContent);
          return hydrateUser(user);
        } catch (error) {
          console.warn(`Could not load user data for ${userId}, skipping. Error:`, error);
          return null;
        }
      })
    );

    const validUsers = users.filter((user): user is User => user !== null);
    return NextResponse.json(validUsers);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}
