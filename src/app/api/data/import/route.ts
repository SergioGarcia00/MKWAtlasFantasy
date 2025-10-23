'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ROSTERS_PATH = path.join(process.cwd(), 'src', 'lib', 'rosters_actualizado.json');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    const content = await file.text();
    const importData = JSON.parse(content);

    // Write to main data files
    for (const filename in importData) {
      if (filename.endsWith('.json') && filename !== 'rosters_actualizado.json' && filename !== 'users') {
        const filePath = path.join(DATA_DIR, filename);
        await fs.writeFile(filePath, JSON.stringify(importData[filename], null, 2), 'utf-8');
      }
    }

    // Write to user files
    if (importData.users) {
        const usersDir = path.join(DATA_DIR, 'users');
        for (const userKey in importData.users) {
            const userFilePath = path.join(usersDir, `${userKey}.json`);
            await fs.writeFile(userFilePath, JSON.stringify(importData.users[userKey], null, 2), 'utf-8');
        }
    }
    

    // Write to the main rosters file
    if (importData['rosters_actualizado.json']) {
      await fs.writeFile(ROSTERS_PATH, JSON.stringify(importData['rosters_actualizado.json'], null, 2), 'utf-8');
    }

    return NextResponse.json({ message: 'Data imported successfully.' });

  } catch (error: any) {
    console.error('Data import failed:', error);
    return NextResponse.json({ message: `Error importing data: ${error.message}` }, { status: 500 });
  }
}
