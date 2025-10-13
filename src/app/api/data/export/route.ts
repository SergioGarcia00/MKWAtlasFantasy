
'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { USER_IDS } from '@/data/users';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');
const DAILY_MARKET_PATH = path.join(process.cwd(), 'src', 'data', 'daily_market.json');
const WEEKS_PATH = path.join(process.cwd(), 'src', 'data', 'weeks.json');

export async function GET(request: Request) {
    try {
        const users = await Promise.all(USER_IDS.map(async (id) => {
            const filePath = path.join(USERS_DIR, `${id}.json`);
            const userContent = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(userContent);
        }));
        
        const marketContent = await fs.readFile(DAILY_MARKET_PATH, 'utf-8');
        const dailyMarket = JSON.parse(marketContent);
        
        const weeksContent = await fs.readFile(WEEKS_PATH, 'utf-8');
        const weeks = JSON.parse(weeksContent);

        const exportData = {
            users,
            daily_market: dailyMarket,
            weeks,
        };

        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.set('Content-Disposition', 'attachment; filename="data_export.json"');

        return new NextResponse(JSON.stringify(exportData, null, 2), { headers });

    } catch (error) {
        console.error('Failed to export data:', error);
        return NextResponse.json({ message: 'Error exporting data' }, { status: 500 });
    }
}
