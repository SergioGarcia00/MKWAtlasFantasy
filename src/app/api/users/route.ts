
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
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
        weeklyScores: user.weeklyScores || {},
    };
};

export async function GET(request: Request) {
  try {
    const userFiles = await fs.readdir(USERS_DATA_DIR);
    const jsonFiles = userFiles.filter(file => file.endsWith('.json'));

    const users = await Promise.all(
      jsonFiles.map(async (fileName) => {
        const filePath = path.join(USERS_DATA_DIR, fileName);
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          if (fileContent) {
            const user = JSON.parse(fileContent);
            return hydrateUser(user);
          }
          return null;
        } catch (error) {
          console.warn(`Could not load or parse user data for ${fileName}, skipping. Error:`, error);
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
