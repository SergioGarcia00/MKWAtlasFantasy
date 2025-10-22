'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { USER_IDS } from '@/data/users';
import type { User, UserPlayer, Player, RosterTeam } from '@/lib/types';
import { ALL_PLAYERS } from '@/data/players';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');
const ROSTERS_PATH = path.join(process.cwd(), 'src', 'lib', 'rosters_actualizado.json');

async function getUser(userId: string): Promise<User | null> {
    const filePath = path.join(USERS_DIR, `${userId}.json`);
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error reading user file for ${userId}:`, error);
        return null;
    }
}

async function getAllUsers(): Promise<User[]> {
    const users: User[] = [];
    for (const id of USER_IDS) {
        const user = await getUser(id);
        if (user) {
            users.push(user);
        }
    }
    return users;
}

export async function POST(request: Request) {
    try {
        const users = await getAllUsers();
        
        // 1. Aggregate all bids
        const bidsByPlayer: Record<string, { userId: string, amount: number, userName: string }[]> = {};
        users.forEach(user => {
            if (user.bids) {
                Object.entries(user.bids).forEach(([playerId, amount]) => {
                    if (!bidsByPlayer[playerId]) {
                        bidsByPlayer[playerId] = [];
                    }
                    bidsByPlayer[playerId].push({ userId: user.id, userName: user.name, amount });
                });
            }
        });

        // 2. Determine winners
        const winners: { playerId: string; userId: string; amount: number; }[] = [];
        for (const playerId in bidsByPlayer) {
            const bids = bidsByPlayer[playerId];
            if (bids.length > 0) {
                const winningBid = bids.reduce((highest, current) => current.amount > highest.amount ? current : highest, bids[0]);
                winners.push({ playerId, userId: winningBid.userId, amount: winningBid.amount });
            }
        }
        
        // --- Read rosters file to update costs ---
        const rostersContent = await fs.readFile(ROSTERS_PATH, 'utf-8');
        const rosters: RosterTeam[] = JSON.parse(rostersContent);

        // 3. Process winners, update user files AND player costs
        for (const winner of winners) {
            const userFilePath = path.join(USERS_DIR, `${winner.userId}.json`);
            try {
                const winningUser = await getUser(winner.userId);
                if (winningUser) {
                    if (winningUser.players.length < 10 && winningUser.currency >= winner.amount) {
                        // --- Update User ---
                        const newUserPlayer: UserPlayer = { id: winner.playerId, purchasedAt: Date.now() };
                        
                        winningUser.players.push(newUserPlayer);
                        if (!winningUser.roster.bench.includes(winner.playerId)) {
                            winningUser.roster.bench.push(winner.playerId);
                        }
                        
                        winningUser.currency -= winner.amount;
                        await fs.writeFile(userFilePath, JSON.stringify(winningUser, null, 2), 'utf-8');
                        
                        // --- Update Player Cost ---
                        let playerFoundAndUpdated = false;
                        for (const team of rosters) {
                            const playerToUpdate = team.players.find(p => p.id === winner.playerId);
                            if (playerToUpdate) {
                                playerToUpdate.cost = winner.amount;
                                playerFoundAndUpdated = true;
                                break;
                            }
                        }
                        if (!playerFoundAndUpdated) {
                            console.warn(`Could not find player ${winner.playerId} in rosters_actualizado.json to update cost.`);
                        }

                    }
                }
            } catch (error) {
                console.error(`Failed to update winner ${winner.userId}:`, error);
            }
        }
        
        // --- Write the updated rosters file back ---
        await fs.writeFile(ROSTERS_PATH, JSON.stringify(rosters, null, 2), 'utf-8');

        // 4. Clear all bids for all users
        for (const userId of USER_IDS) {
            const userFilePath = path.join(USERS_DIR, `${userId}.json`);
             try {
                const user = await getUser(userId);
                if (user) {
                    user.bids = {};
                    await fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
                }
             } catch(error) {
                 console.error(`Failed to clear bids for user ${userId}:`, error);
             }
        }

        return NextResponse.json({ message: 'Auctions locked in successfully', winners });

    } catch (error) {
        console.error('Failed to lock in auctions:', error);
        return NextResponse.json({ message: 'Error locking in auctions' }, { status: 500 });
    }
}
