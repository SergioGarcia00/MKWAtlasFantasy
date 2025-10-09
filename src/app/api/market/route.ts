
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const DAILY_MARKET_PATH = path.join(process.cwd(), 'src', 'data', 'daily_market.json');

export async function GET(request: Request) {
    try {
        const fileContent = await fs.readFile(DAILY_MARKET_PATH, 'utf-8');
        const marketPlayers = JSON.parse(fileContent);
        return NextResponse.json(marketPlayers);
    } catch (error) {
        // If the file doesn't exist, it means the market hasn't been generated yet.
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return NextResponse.json([]);
        }
        console.error('Failed to read daily market data:', error);
        return NextResponse.json({ message: 'Error reading market data' }, { status: 500 });
    }
}
