'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { Player, User, UserPlayer } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');
const TARGET_COST = 20000;
const TEAM_SIZE = 6;

// Helper to shuffle an array
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

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

async function updateUser(user: User): Promise<void> {
    const userFilePath = path.join(USERS_DIR, `${user.id}.json`);
    await fs.writeFile(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
}


// Function to find a team of players with a total cost close to the target
function findTeamForTarget(players: Player[], target: number, teamSize: number): Player[] | null {
    const shuffledPlayers = shuffleArray([...players]);
    
    // Naive greedy approach: try to find a combination
    // This is a variation of the subset sum problem, which is NP-hard.
    // A greedy approach is not optimal but can work for this use case.
    for (let i = 0; i < 1000; i++) { // Try up to 1000 random combinations
        const potentialTeam: Player[] = [];
        let remainingPlayers = [...shuffledPlayers];
        let currentCost = 0;
        
        while (potentialTeam.length < teamSize && remainingPlayers.length > 0) {
            const playerIndex = Math.floor(Math.random() * remainingPlayers.length);
            const player = remainingPlayers[playerIndex];

            if (currentCost + player.cost <= target + 2000) { // Allow some flexibility
                potentialTeam.push(player);
                currentCost += player.cost;
                remainingPlayers.splice(playerIndex, 1);
            } else {
                 remainingPlayers.splice(playerIndex, 1);
            }
        }
        
        if (potentialTeam.length === teamSize && Math.abs(currentCost - target) <= 3000) {
            return potentialTeam;
        }
    }
    
    return null; // Return null if no suitable team is found
}


export async function POST(request: Request) {
    try {
        const allUsers = await getAllUsers();
        let availablePlayers = [...ALL_PLAYERS];
        let updatedUsersCount = 0;

        for (const user of allUsers) {
            // Find a suitable team from the available players
            const team = findTeamForTarget(availablePlayers, TARGET_COST, TEAM_SIZE);

            if (team) {
                // Assign players to user
                const userPlayers: UserPlayer[] = team.map(p => ({ id: p.id, purchasedAt: Date.now() }));
                user.players = userPlayers;
                user.roster = {
                    lineup: team.map(p => p.id), // Add all to lineup initially
                    bench: [],
                };
                
                // Remove assigned players from the available pool
                const teamIds = new Set(team.map(p => p.id));
                availablePlayers = availablePlayers.filter(p => !teamIds.has(p.id));
                
                // Update user file
                await updateUser(user);
                updatedUsersCount++;
            } else {
                 console.warn(`Could not find a suitable team for user ${user.id}`);
            }
        }

        if (updatedUsersCount === 0) {
            return NextResponse.json({ message: 'Could not assign teams. Not enough available players or cost constraints too tight.' }, { status: 500 });
        }
        
        return NextResponse.json({ message: 'Starter teams assigned successfully.', updatedUsers: updatedUsersCount });

    } catch (error) {
        console.error('Failed to assign starter teams:', error);
        return NextResponse.json({ message: 'Error assigning starter teams' }, { status: 500 });
    }
}
