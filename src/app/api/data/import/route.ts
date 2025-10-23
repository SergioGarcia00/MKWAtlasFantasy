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
    const errors: string[] = [];

    // --- Write Daily Market Data (This is the fix) ---
    if (importData['daily_market.json']) {
      try {
        await fs.writeFile(DAILY_MARKET_PATH, JSON.stringify(importData['daily_market.json'], null, 2), 'utf-8');
        filesWritten++;
        writtenFiles.push('daily_market.json');
      } catch (e: any) {
        errors.push(`Failed to write daily_market.json: ${e.message}`);
      }
    }

    // --- Write User Data ---
    if (importData.users && typeof importData.users === 'object') {
      try {
        await fs.mkdir(USERS_DIR, { recursive: true });
        let userFilesCount = 0;
        for (const userKey in importData.users) {
          if (Object.prototype.hasOwnProperty.call(importData.users, userKey)) {
            const userFilePath = path.join(USERS_DIR, `${userKey}.json`);
            await fs.writeFile(userFilePath, JSON.stringify(importData.users[userKey], null, 2), 'utf-8');
            userFilesCount++;
          }
        }
        if (userFilesCount > 0) {
            writtenFiles.push(`${userFilesCount} user files`);
            filesWritten += userFilesCount;
        }
      } catch (e: any) {
        errors.push(`Failed to write user data: ${e.message}`);
      }
    }

    // --- Write Rosters Data ---
    if (importData['rosters_actualizado.json']) {
      try {
        await fs.writeFile(ROSTERS_PATH, JSON.stringify(importData['rosters_actualizado.json'], null, 2), 'utf-8');
        filesWritten++;
        writtenFiles.push('rosters_actualizado.json');
      } catch (e: any) {
        errors.push(`Failed to write rosters_actualizado.json: ${e.message}`);
      }
    }
    
    // --- Write Weeks Data ---
    if (importData['weeks.json']) {
      try {
        await fs.writeFile(WEEKS_PATH, JSON.stringify(importData['weeks.json'], null, 2), 'utf-8');
        filesWritten++;
        writtenFiles.push('weeks.json');
      } catch (e: any) {
        errors.push(`Failed to write weeks.json: ${e.message}`);
      }
    }

    if (errors.length > 0) {
        throw new Error(errors.join('; '));
    }

    if (filesWritten === 0) {
        return NextResponse.json({ message: 'Import finished, but no data was updated. Check the structure of your JSON file.' }, { status: 400 });
    }

    return NextResponse.json({ message: `Data imported successfully. ${writtenFiles.length > 0 ? writtenFiles.join(', ') : '0 sections'} were processed.` });

  } catch (error: any) {
    console.error('Data import failed:', error);
    return NextResponse.json({ message: `Error importing data: ${error.message}` }, { status: 500 });
  }
}
