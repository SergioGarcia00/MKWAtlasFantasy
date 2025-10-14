
'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const DAILY_MARKET_PATH = path.join(process.cwd(), 'src', 'data', 'daily_market.json');

// Get all players in the current daily market
export async function GET() {
  try {
    const marketData = await fs.readFile(DAILY_MARKET_PATH, 'utf-8');
    const market = JSON.parse(marketData);
    return NextResponse.json(market);
  } catch (error) {
    // If the file doesn't exist, return an empty array
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        return NextResponse.json([]);
    }
    console.error('Failed to read daily market data:', error);
    return NextResponse.json({ message: 'Error reading market data' }, { status: 500 });
  }
}
