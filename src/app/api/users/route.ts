
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

// Get all users
export async function GET() {
  try {
    const userFiles = await fs.readdir(USERS_DIR);
    const users = [];
    for (const file of userFiles) {
        if (file.endsWith('.json')) {
            const filePath = path.join(USERS_DIR, file);
            const userContent = await fs.readFile(filePath, 'utf-8');
            users.push(JSON.parse(userContent));
        }
    }
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to read users data:', error);
    return NextResponse.json({ message: 'Error reading users data' }, { status: 500 });
  }
}
