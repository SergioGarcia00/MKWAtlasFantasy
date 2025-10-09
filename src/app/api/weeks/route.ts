import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const WEEKS_DATA_PATH = path.join(process.cwd(), 'src', 'data', 'weeks.json');

// Get all weeks
export async function GET() {
  try {
    const fileContent = await fs.readFile(WEEKS_DATA_PATH, 'utf-8');
    const weeks = JSON.parse(fileContent);
    return NextResponse.json(weeks);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json([]);
    }
    console.error('Failed to read weeks data:', error);
    return NextResponse.json({ message: 'Error reading weeks data' }, { status: 500 });
  }
}

// Add a new week
export async function POST(request: Request) {
  try {
    const newWeek = await request.json();

    let weeks = [];
    try {
      const fileContent = await fs.readFile(WEEKS_DATA_PATH, 'utf-8');
      weeks = JSON.parse(fileContent);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      // If file doesn't exist, we'll create it with the new week.
    }
    
    // Check if week already exists
    if (weeks.some((w: {id: string}) => w.id === newWeek.id)) {
        return NextResponse.json({ message: `Week ${newWeek.id} already exists.`}, { status: 409 });
    }

    weeks.push(newWeek);

    await fs.writeFile(WEEKS_DATA_PATH, JSON.stringify(weeks, null, 2), 'utf-8');
    
    return NextResponse.json(newWeek, { status: 201 });
  } catch (error) {
    console.error('Failed to create new week:', error);
    return NextResponse.json({ message: 'Error creating new week' }, { status: 500 });
  }
}
