'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ROSTERS_PATH = path.join(process.cwd(), 'src', 'lib', 'rosters_actualizado.json');

export async function GET(request: Request) {
  try {
    const exportData: Record<string, any> = {};

    // Read all files in the data directory
    const dataFilenames = await fs.readdir(DATA_DIR);
    for (const filename of dataFilenames) {
      if (filename.endsWith('.json')) {
        const filePath = path.join(DATA_DIR, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        exportData[filename] = JSON.parse(content);
      }
    }
    
     // Read user data from the subdirectory
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

    // Read the main rosters file
    const rostersContent = await fs.readFile(ROSTERS_PATH, 'utf-8');
    exportData['rosters_actualizado.json'] = JSON.parse(rostersContent);

    // Create the final export object
    const finalExport = {
      ...exportData,
    };

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename="data_export.json"`);

    return new NextResponse(JSON.stringify(finalExport, null, 2), { headers });

  } catch (error: any) {
    console.error('Data export failed:', error);
    return NextResponse.json({ message: `Error exporting data: ${error.message}` }, { status: 500 });
  }
}
