import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  const filePath = path.join(USERS_DIR, `${userId}.json`);

  try {
    const userContent = await fs.readFile(filePath, 'utf-8');
    const user = JSON.parse(userContent);
    return NextResponse.json(user);
  } catch (error) {
    // Check if the error is because the file doesn't exist
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        return NextResponse.json({ message: `User ${userId} not found` }, { status: 404 });
    }
    console.error(`Error reading user ${userId}:`, error);
    return NextResponse.json({ message: `Error fetching user ${userId}` }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  const filePath = path.join(USERS_DIR, `${userId}.json`);

  try {
    const body = await request.json();
    await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json(body);
  } catch (error) {
    console.error('Failed to write user data:', error);
    return NextResponse.json({ message: 'Error updating user data' }, { status: 500 });
  }
}
