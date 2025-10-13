'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { User } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

export async function POST(
  request: Request
) {
  try {
    const { userId, amount, isReset } = await request.json();

    if (!userId || typeof amount !== 'number') {
      return NextResponse.json({ message: 'User ID and amount are required' }, { status: 400 });
    }

    const userFilePath = path.join(USERS_DIR, `${userId}.json`);
    
    // --- Read-Modify-Write Start ---
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
    // --- Read-Modify-Write End ---
    
    return NextResponse.json(user);

  } catch (error) {
    console.error('Failed to update currency:', error);
    return NextResponse.json({ message: 'Error updating currency' }, { status: 500 });
  }
}
