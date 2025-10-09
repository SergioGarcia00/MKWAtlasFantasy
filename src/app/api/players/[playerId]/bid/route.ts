'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { User, Player } from '@/lib/types';

const ROSTERS_PATH = path.join(process.cwd(), 'src', 'lib', 'rosters_actualizado.json');
const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

async function getAllPlayers() {
    const fileContent = await fs.readFile(ROSTERS_PATH, 'utf-8');
    const rosterData = JSON.parse(fileContent);
    // This is a simplified version of your player processing logic
    // In a real app, this would be a shared utility
    const allPlayers: Player[] = [];
    rosterData.forEach((team: any) => {
        team.players.forEach((playerData: any) => {
            if (playerData.name && playerData.mmr) {
                const playerId = `${playerData.name.replace(/[^a-zA-Z0-9]/g, '')}-${team.teamId}`;
                allPlayers.push({ id: playerId, ...playerData });
            }
        });
    });
    return allPlayers;
}

async function getAllUsers(): Promise<User[]> {
    const userFiles = await fs.readdir(USERS_DIR);
    const users: User[] = [];
    for (const file of userFiles) {
        if (file.endsWith('.json')) {
            const filePath = path.join(USERS_DIR, file);
            const userContent = await fs.readFile(filePath, 'utf-8');
            users.push(JSON.parse(userContent));
        }
    }
    return users;
}

export async function POST(
  request: Request,
  { params }: { params: { playerId: string } }
) {
  try {
    const { playerId } = params;
    const { userId, bidAmount } = await request.json();

    if (!userId || !bidAmount) {
      return NextResponse.json({ message: 'User ID and bid amount are required' }, { status: 400 });
    }

    const allUsers = await getAllUsers();
    const bidder = allUsers.find(u => u.id === userId);
    
    if (!bidder) {
      return NextResponse.json({ message: 'Bidder not found' }, { status: 404 });
    }

    // This is a simplified auction logic. In a real app, you'd have a separate data store for auctions.
    // For now, we'll find the player in the main player list and update a temporary auction field.
    // THIS IS NOT PRODUCTION READY LOGIC.
    // It's a placeholder to demonstrate the concept.
    
    // Find the current owner of the player to update their data.
    let owner: User | undefined;
    for (const u of allUsers) {
        if (u.players.some(p => p.id === playerId)) {
            owner = u;
            break;
        }
    }

    if(owner && owner.id === userId) {
        return NextResponse.json({ message: "You can't bid on your own player" }, { status: 400 });
    }

    const totalBidAmount = Object.values(bidder.bids || {}).reduce((sum, amount) => sum + amount, 0);

    if (bidder.currency < (totalBidAmount + bidAmount)) {
        return NextResponse.json({ message: 'Insufficient funds' }, { status: 400 });
    }
    
    // For now, we just update the user's bids. A more complete system
    // would update a central auction object for the player.
    const updatedUser = {
        ...bidder,
        bids: {
            ...bidder.bids,
            [playerId]: Math.max(bidder.bids?.[playerId] || 0, bidAmount),
        }
    };
    
    const userFilePath = path.join(USERS_DIR, `${userId}.json`);
    await fs.writeFile(userFilePath, JSON.stringify(updatedUser, null, 2), 'utf-8');


    return NextResponse.json({ message: 'Bid placed successfully' });

  } catch (error) {
    console.error('Failed to place bid:', error);
    return NextResponse.json({ message: 'Error placing bid' }, { status: 500 });
  }
}
