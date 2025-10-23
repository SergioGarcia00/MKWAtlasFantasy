'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  const filePath = path.join(USERS_DIR, `${userId}.json`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const user = JSON.parse(fileContent);
    return NextResponse.json(user);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to read user data' }, { status: 500 });
  }
}
