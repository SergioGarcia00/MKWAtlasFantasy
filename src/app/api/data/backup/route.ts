'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { USER_IDS } from '@/data/users';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');

// --- Función para leer un archivo JSON de forma segura ---
async function readJsonFile(filePath: string, defaultValue: any = []) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.warn(`File not found, returning default value: ${filePath}`);
            return defaultValue;
        }
        console.error(`Error reading ${filePath}:`, error);
        throw error; // Rethrow other errors
    }
}

export async function POST(request: Request) {
    // Protección básica: solo permitir peticiones POST (o podrías añadir una clave secreta)
    if (request.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }
    
    try {
        // --- Recopilar todos los datos ---
        const users = await Promise.all(USER_IDS.map(id => 
            readJsonFile(path.join(USERS_DIR, `${id}.json`), {})
        ));
        
        const dailyMarket = await readJsonFile(path.join(DATA_DIR, 'daily_market.json'));
        const weeks = await readJsonFile(path.join(DATA_DIR, 'weeks.json'));

        const backupData = {
            users,
            daily_market: dailyMarket,
            weeks,
            last_backup_timestamp: new Date().toISOString(),
        };

        // --- Escribir en el archivo de backup ---
        const backupFilePath = path.join(DATA_DIR, 'data_backup.json');
        await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

        return NextResponse.json({ message: 'Data backup created successfully.' });

    } catch (error) {
        console.error('Failed to create data backup:', error);
        return NextResponse.json({ message: 'Error creating data backup' }, { status: 500 });
    }
}
