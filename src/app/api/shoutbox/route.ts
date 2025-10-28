'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const SHOUTBOX_PATH = path.join(process.cwd(), 'src', 'data', 'shoutbox.json');
const MAX_MESSAGES = 50;

async function readShoutboxFile() {
    try {
        const fileContent = await fs.readFile(SHOUTBOX_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return []; // If file doesn't exist, start with an empty array
        }
        throw error;
    }
}

export async function GET() {
  try {
    const messages = await readShoutboxFile();
    messages.sort((a: any, b: any) => b.timestamp - a.timestamp);
    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to read shoutbox data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, userName, message } = await request.json();

    if (!userId || !userName || !message) {
      return NextResponse.json({ message: 'User ID, name, and message are required' }, { status: 400 });
    }
    
    if (message.trim().length === 0 || message.length > 280) {
       return NextResponse.json({ message: 'Message must be between 1 and 280 characters.' }, { status: 400 });
    }

    const messages = await readShoutboxFile();
    
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      userId,
      userName,
      timestamp: Date.now(),
      message: message.trim(),
    };

    const updatedMessages = [newMessage, ...messages].slice(0, MAX_MESSAGES);
    
    await fs.writeFile(SHOUTBOX_PATH, JSON.stringify(updatedMessages, null, 2), 'utf-8');
    
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    console.error('Failed to post message:', error);
    return NextResponse.json({ message: `Error posting message: ${error.message}` }, { status: 500 });
  }
}
