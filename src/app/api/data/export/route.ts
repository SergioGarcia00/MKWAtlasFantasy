
'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { User } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');
const DAILY_MARKET_PATH = path.join(process.cwd(), 'src', 'data', 'daily_market.json');
const WEEKS_DATA_PATH = path.join(process.cwd(), 'src', 'data', 'weeks.json');

async function safelyReadFile(filePath: string, defaultValue: any = null) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return defaultValue;
        }
        console.error(`Error reading file ${filePath}:`, error);
        return defaultValue;
    }
}

export async function GET(request: Request) {
    try {
        // Get all users
        const userFiles = await fs.readdir(USERS_DIR);
        const users = await Promise.all(
            userFiles
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const filePath = path.join(USERS_DIR, file);
                    return safelyReadFile(filePath);
                })
        );
        const validUsers = users.filter(user => user !== null);

        // Get other data
        const dailyMarket = await safelyReadFile(DAILY_MARKET_PATH, []);
        const weeks = await safelyReadFile(WEEKS_DATA_PATH, []);

        const exportData = {
            users: validUsers,
            daily_market: dailyMarket,
            weeks: weeks,
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
