import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const WEEKS_PATH = path.join(process.cwd(), 'src', 'data', 'weeks.json');

// Get all weeks
export async function GET() {
  try {
    const weeksData = await fs.readFile(WEEKS_PATH, 'utf-8');
    const weeks = JSON.parse(weeksData);
    return NextResponse.json(weeks);
  } catch (error) {
    console.error('Failed to read weeks data:', error);
    return NextResponse.json({ message: 'Error reading weeks data' }, { status: 500 });
  }
}

// Add a new week
export async function POST(request: Request) {
  try {
    const weeksData = await fs.readFile(WEEKS_PATH, 'utf-8');
    const weeks = JSON.parse(weeksData);
    
    const newWeek = await request.json();
    weeks.push(newWeek);

    await fs.writeFile(WEEKS_PATH, JSON.stringify(weeks, null, 2), 'utf-8');
    
    return NextResponse.json(newWeek, { status: 201 });
  } catch (error) {
    console.error('Failed to create new week:', error);
    return NextResponse.json({ message: 'Error creating new week' }, { status: 500 });
  }
}
