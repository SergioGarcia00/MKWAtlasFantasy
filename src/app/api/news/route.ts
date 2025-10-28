'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const NEWS_PATH = path.join(process.cwd(), 'src', 'data', 'news.json');

export async function GET() {
  try {
    const fileContent = await fs.readFile(NEWS_PATH, 'utf-8');
    const news = JSON.parse(fileContent);
    // Sort news items by timestamp, newest first
    news.sort((a: any, b: any) => b.timestamp - a.timestamp);
    return NextResponse.json(news);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json([]); // Return empty array if file doesn't exist
    }
    return NextResponse.json({ message: 'Failed to read news data' }, { status: 500 });
  }
}
