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

    // Process all keys in the imported data
    for (const key in importData) {
        if (!importData.hasOwnProperty(key)) continue;

        if (key === 'users') {
            const usersDir = path.join(DATA_DIR, 'users');
            await fs.mkdir(usersDir, { recursive: true });
            for (const userKey in importData.users) {
                const userFilePath = path.join(usersDir, `${userKey}.json`);
                await fs.writeFile(userFilePath, JSON.stringify(importData.users[userKey], null, 2), 'utf-8');
            }
        } else if (key === 'rosters_actualizado.json') {
             await fs.writeFile(ROSTERS_PATH, JSON.stringify(importData[key], null, 2), 'utf-8');
        } else if (key.endsWith('.json')) {
            const filePath = path.join(DATA_DIR, key);
            await fs.writeFile(filePath, JSON.stringify(importData[key], null, 2), 'utf-8');
        }
    }

    return NextResponse.json({ message: 'Data imported successfully.' });

  } catch (error: any) {
    console.error('Data import failed:', error);
    return NextResponse.json({ message: `Error importing data: ${error.message}` }, { status: 500 });
  }
}
