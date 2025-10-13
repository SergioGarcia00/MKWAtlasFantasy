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
    // Note: In this local file setup, params.userId isn't used directly to find the file,
    // but we get it from the body. This structure is kept for potential API consistency.
    const { userId, amount, isReset } = await request.json();

    if (!userId || typeof amount !== 'number') {
      return NextResponse.json({ message: 'User ID and amount are required' }, { status: 400 });
    }

    const userFilePath = path.join(USERS_DIR, `${userId}.json`);
    let user: User;
    try {
        const userContent = await fs.readFile(userFilePath, 'utf-8');
        user = JSON.parse(userContent);
    } catch(e) {
        return NextResponse.json({ message: `User ${userId} not found` }, { status: 404 });
    }
    
    let newCurrency;

    if (isReset) {
        newCurrency = amount;
    } else {
        newCurrency = (user.currency || 0) + amount;
    }

    user.currency = newCurrency;

    await fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
    
    return NextResponse.json(user);

  } catch (error) {
    console.error('Failed to update currency:', error);
    return NextResponse.json({ message: 'Error updating currency' }, { status: 500 });
  }
}
