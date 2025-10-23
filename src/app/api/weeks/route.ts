'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const WEEKS_PATH = path.join(process.cwd(), 'src', 'data', 'weeks.json');

export async function GET() {
  try {
    const fileContent = await fs.readFile(WEEKS_PATH, 'utf-8');
    const weeks = JSON.parse(fileContent);
    return NextResponse.json(weeks);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json([]);
    }
    return NextResponse.json({ message: 'Failed to read weeks data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const fileContent = await fs.readFile(WEEKS_PATH, 'utf-8');
    const weeks = JSON.parse(fileContent);
    
    const newWeekId = (weeks.length + 1).toString();
    const newWeek = { id: newWeekId, name: `Week ${newWeekId}` };
    
    weeks.push(newWeek);
    
    await fs.writeFile(WEEKS_PATH, JSON.stringify(weeks, null, 2), 'utf-8');
    
    return NextResponse.json(newWeek, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to create new week' }, { status: 500 });
  }
}
