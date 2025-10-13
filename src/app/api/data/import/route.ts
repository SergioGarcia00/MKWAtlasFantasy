
'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { USER_IDS } from '@/data/users';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');

async function clearDirectory(directory: string) {
    try {
        const files = await fs.readdir(directory);
        await Promise.all(files.map(file => fs.unlink(path.join(directory, file))));
    } catch (error) {
        // Directory might not exist, which is fine.
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.error(`Error clearing directory ${directory}:`, error);
            throw error; // Re-throw if it's not a "not found" error
        }
    }
}


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
        
        // Validate required keys
        const requiredKeys = ['users', 'daily_market', 'weeks'];
        for (const key of requiredKeys) {
            if (!data.hasOwnProperty(key)) {
                 return NextResponse.json({ message: `Invalid JSON format. Missing key: "${key}"` }, { status: 400 });
            }
        }
        
        // --- Start Data Overwrite ---

        // Clear existing user files
        await clearDirectory(USERS_DIR);
        // Ensure directory exists
        await fs.mkdir(USERS_DIR, { recursive: true });

        // Write new user files
        await Promise.all(
            data.users.map((user: any) => {
                const userFilePath = path.join(USERS_DIR, `${user.id}.json`);
                return fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
            })
        );
        
        // Write other data files
        const dailyMarketPath = path.join(DATA_DIR, 'daily_market.json');
        await fs.writeFile(dailyMarketPath, JSON.stringify(data.daily_market, null, 2), 'utf-8');

        const weeksPath = path.join(DATA_DIR, 'weeks.json');
        await fs.writeFile(weeksPath, JSON.stringify(data.weeks, null, 2), 'utf-8');
        
        return NextResponse.json({ message: 'Data imported successfully! The application data has been updated.' });

    } catch (error: any) {
        console.error('Failed to import data:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid JSON file. Please check the file content.' }, { status: 400 });
        }
        return NextResponse.json({ message: `Error importing data: ${error.message}` }, { status: 500 });
    }
}
