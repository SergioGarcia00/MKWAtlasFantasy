import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { User, Player } from '@/lib/types';

const USERS_DATA_DIR = path.join(process.cwd(), 'src', 'data', 'users');

// Helper to ensure player objects are fully hydrated
const hydrateUser = (user: any): User => {
    const playerIdsToObjects = new Map(ALL_PLAYERS.map(p => [p.id, p]));

    const hydratePlayerArray = (arr: (string | Player)[]): Player[] =>
        arr.map(p => (typeof p === 'string' ? playerIdsToObjects.get(p) : p))
           .filter((p): p is Player => p !== undefined);

    return {
        ...user,
        players: hydratePlayerArray(user.players || []),
        roster: {
            lineup: hydratePlayerArray(user.roster?.lineup || []),
            bench: hydratePlayerArray(user.roster?.bench || []),
        },
    };
};

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  const filePath = path.join(USERS_DATA_DIR, `${userId}.json`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const user = JSON.parse(fileContent);
    const hydratedUser = hydrateUser(user);
    return NextResponse.json(hydratedUser);
  } catch (error) {
    return NextResponse.json({ message: `User ${userId} not found` }, { status: 404 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  const filePath = path.join(USERS_DATA_DIR, `${userId}.json`);

  try {
    const body: User = await request.json();

    // Dehydrate player data to store only IDs
    const dehydratedUser = {
        ...body,
        players: body.players.map(p => p.id),
        roster: {
            lineup: body.roster.lineup.map(p => p.id),
            bench: body.roster.bench.map(p => p.id),
        }
    };

    await fs.writeFile(filePath, JSON.stringify(dehydratedUser, null, 2), 'utf-8');
    
    // Return the hydrated user object to the client
    return NextResponse.json(body);
  } catch (error) {
    console.error('Failed to update user data:', error);
    return NextResponse.json({ message: 'Error updating user data' }, { status: 500 });
  }
}
