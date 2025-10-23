'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ROSTERS_PATH = path.join(process.cwd(), 'src', 'lib', 'rosters_actualizado.json');
const DAILY_MARKET_PATH = path.join(DATA_DIR, 'daily_market.json');
const WEEKS_PATH = path.join(DATA_DIR, 'weeks.json');


export async function GET(request: Request) {
  try {
    const exportData: Record<string, any> = {};

    // Explicitly read known files to avoid stat issues
    try {
        const rostersContent = await fs.readFile(ROSTERS_PATH, 'utf-8');
        exportData['rosters_actualizado.json'] = JSON.parse(rostersContent);
    } catch (e) {
        console.warn(`Could not read rosters_actualizado.json. Skipping.`);
    }

    try {
        const marketContent = await fs.readFile(DAILY_MARKET_PATH, 'utf-8');
        exportData['daily_market.json'] = JSON.parse(marketContent);
    } catch (e) {
        console.warn(`Could not read daily_market.json. Skipping.`);
    }

    try {
        const weeksContent = await fs.readFile(WEEKS_PATH, 'utf-8');
        exportData['weeks.json'] = JSON.parse(weeksContent);
    } catch(e) {
        console.warn(`Could not read weeks.json. Skipping.`);
    }
    
     // Read user data from the subdirectory
    try {
        const usersDir = path.join(DATA_DIR, 'users');
        const userFilenames = await fs.readdir(usersDir);
        exportData['users'] = {};
        for (const filename of userFilenames) {
            if(filename.endsWith('.json')) {
                const filePath = path.join(usersDir, filename);
                const content = await fs.readFile(filePath, 'utf-8');
                const userKey = filename.replace('.json', '');
                exportData['users'][userKey] = JSON.parse(content);
            }
        }
    } catch (e) {
         console.warn(`Could not read users directory. Skipping.`);
    }


    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename="data_export.json"`);

    return new NextResponse(JSON.stringify(exportData, null, 2), { headers });

  } catch (error: any) {
    console.error('Data export failed:', error);
    return NextResponse.json({ message: `Error exporting data: ${error.message}` }, { status: 500 });
  }
}
