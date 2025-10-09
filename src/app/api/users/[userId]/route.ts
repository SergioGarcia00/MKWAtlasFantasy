import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { User, Player, UserPlayer } from '@/lib/types';

const USERS_DATA_DIR = path.join(process.cwd(), 'src', 'data', 'users');

const hydratePlayer = (p: string | UserPlayer): UserPlayer => {
    if (typeof p === 'string') {
        // This is for backward compatibility with old data structure
        return { id: p, purchasedAt: Date.now() - (15 * 24 * 60 * 60 * 1000) }; // Assume old players are past 14 days
    }
    return p;
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
    // Ensure players have the new structure
    user.players = (user.players || []).map(hydratePlayer);
    return NextResponse.json(user);
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
    
    // Data is already in the correct format for saving
    await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8');
    
    // Return the saved user object to the client
    return NextResponse.json(body);
  } catch (error) {
    console.error('Failed to update user data:', error);
    return NextResponse.json({ message: 'Error updating user data' }, { status: 500 });
  }
}
