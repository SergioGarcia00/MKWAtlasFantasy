
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { User, UserPlayer } from '@/lib/types';

const USERS_DATA_DIR = path.join(process.cwd(), 'src', 'data', 'users');

const hydratePlayer = (p: string | UserPlayer): UserPlayer => {
    if (typeof p === 'string') {
        // For backward compatibility, assume old players are outside the buyout protection window
        return { id: p, purchasedAt: Date.now() - (15 * 24 * 60 * 60 * 1000) }; 
    }
    return p;
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
            // Ensure all users have the new player structure
            user.players = (user.players || []).map(hydratePlayer);
            user.roster = {
                lineup: user.roster?.lineup || [],
                bench: user.roster?.bench || [],
            }
            user.weeklyScores = user.weeklyScores || {};
            return user;
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
