import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const DAILY_MARKET_PATH = path.join(process.cwd(), 'src', 'data', 'daily_market.json');

export async function GET(request: Request) {
    try {
        const marketData = await fs.readFile(DAILY_MARKET_PATH, 'utf-8');
        const marketPlayers = JSON.parse(marketData);
        return NextResponse.json(marketPlayers);
    } catch (error) {
        console.error('Failed to read daily market data:', error);
        return NextResponse.json({ message: 'Error reading market data' }, { status: 500 });
    }
}
