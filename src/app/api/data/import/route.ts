'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const ROSTERS_PATH = path.join(process.cwd(), 'src', 'lib', 'rosters_actualizado.json');
const DAILY_MARKET_PATH = path.join(DATA_DIR, 'daily_market.json');
const WEEKS_PATH = path.join(DATA_DIR, 'weeks.json');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    const content = await file.text();
    const importData = JSON.parse(content);

    let filesWritten = 0;
    const writtenFiles: string[] = [];

    // --- Write User Data ---
    if (importData.users && typeof importData.users === 'object') {
      await fs.mkdir(USERS_DIR, { recursive: true });
      for (const userKey in importData.users) {
        if (Object.prototype.hasOwnProperty.call(importData.users, userKey)) {
          const userFilePath = path.join(USERS_DIR, `${userKey}.json`);
          await fs.writeFile(userFilePath, JSON.stringify(importData.users[userKey], null, 2), 'utf-8');
          filesWritten++;
        }
      }
      writtenFiles.push(`${Object.keys(importData.users).length} user files`);
    }

    // --- Write Rosters Data ---
    if (importData['rosters_actualizado.json']) {
      await fs.writeFile(ROSTERS_PATH, JSON.stringify(importData['rosters_actualizado.json'], null, 2), 'utf-8');
      filesWritten++;
      writtenFiles.push('rosters_actualizado.json');
    }

    // --- Write Daily Market Data ---
    if (importData['daily_market.json']) {
        await fs.writeFile(DAILY_MARKET_PATH, JSON.stringify(importData['daily_market.json'], null, 2), 'utf-8');
        filesWritten++;
        writtenFiles.push('daily_market.json');
    }

    // --- Write Weeks Data ---
    if (importData['weeks.json']) {
      await fs.writeFile(WEEKS_PATH, JSON.stringify(importData['weeks.json'], null, 2), 'utf-8');
      filesWritten++;
      writtenFiles.push('weeks.json');
    }

    if (filesWritten === 0) {
        return NextResponse.json({ message: 'Import finished, but no data was updated. Check the structure of your JSON file.' }, { status: 400 });
    }

    return NextResponse.json({ message: `Data imported successfully. ${filesWritten} files/sections were processed: ${writtenFiles.join(', ')}` });

  } catch (error: any) {
    console.error('Data import failed:', error);
    return NextResponse.json({ message: `Error importing data: ${error.message}` }, { status: 500 });
  }
}
