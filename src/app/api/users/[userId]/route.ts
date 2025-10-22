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
    const updatedData = await request.json();

    // Read-Modify-Write: Read the latest data first to prevent race conditions
    let currentUserData = {};
    try {
      const currentContent = await fs.readFile(filePath, 'utf-8');
      currentUserData = JSON.parse(currentContent);
    } catch (e) {
      // File might not exist yet, that's okay.
    }
    
    // Merge updates, ensuring nested objects are merged correctly
    const finalData = { ...currentUserData, ...updatedData };
    
    // Ensure the ID in the file always matches the file name
    finalData.id = userId;

    await fs.writeFile(filePath, JSON.stringify(finalData, null, 2), 'utf-8');
    return NextResponse.json(finalData);
  } catch (error) {
    console.error('Failed to write user data:', error);
    return NextResponse.json({ message: 'Error updating user data' }, { status: 500 });
  }
}
