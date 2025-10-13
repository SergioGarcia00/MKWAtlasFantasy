
'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { User } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { amount, isReset } = await request.json();

    if (!userId || typeof amount !== 'number') {
      return NextResponse.json({ message: 'User ID and amount are required' }, { status: 400 });
    }

    const userFilePath = path.join(USERS_DIR, `${userId}.json`);
    
    try {
        const userContent = await fs.readFile(userFilePath, 'utf-8');
        const user: User = JSON.parse(userContent);

        if (isReset) {
            user.currency = amount;
        } else {
            user.currency += amount;
        }

        await fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');

        return NextResponse.json(user);

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return NextResponse.json({ message: `User ${userId} not found` }, { status: 404 });
        }
        throw error;
    }

  } catch (error) {
    console.error('Failed to update currency:', error);
    return NextResponse.json({ message: 'Error updating currency' }, { status: 500 });
  }
}
