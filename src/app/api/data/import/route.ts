
'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');
const DAILY_MARKET_PATH = path.join(process.cwd(), 'src', 'data', 'daily_market.json');
const WEEKS_PATH = path.join(process.cwd(), 'src', 'data', 'weeks.json');


export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
        }
        
        if (file.type !== 'application/json') {
             return NextResponse.json({ message: 'Invalid file type. Please upload a JSON file.' }, { status: 400 });
        }

        const content = await file.text();
        const data = JSON.parse(content);
        
        const requiredKeys = ['users', 'daily_market', 'weeks'];
        for (const key of requiredKeys) {
            if (!data.hasOwnProperty(key)) {
                 return NextResponse.json({ message: `Invalid JSON format. Missing key: "${key}"` }, { status: 400 });
            }
        }
        
        // --- Start Data Overwrite ---
        // Clear existing user files by overwriting them
        await Promise.all(data.users.map((user: any) => {
             const userFilePath = path.join(USERS_DIR, `${user.id}.json`);
             return fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
        }));

        // Overwrite market and weeks data
        await fs.writeFile(DAILY_MARKET_PATH, JSON.stringify(data.daily_market || [], null, 2), 'utf-8');
        await fs.writeFile(WEEKS_PATH, JSON.stringify(data.weeks || [], null, 2), 'utf-8');
        
        return NextResponse.json({ message: 'Data imported successfully! The application data has been updated.' });

    } catch (error: any) {
        console.error('Failed to import data:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid JSON file. Please check the file content.' }, { status: 400 });
        }
        return NextResponse.json({ message: `Error importing data: ${error.message}` }, { status: 500 });
    }
}
