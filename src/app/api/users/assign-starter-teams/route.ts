'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { Player, User, UserPlayer } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');
const TEAM_SIZE = 6;
const TARGET_MIN_COST = 19000;
const TARGET_MAX_COST = 21000;


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

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export async function POST(request: Request) {
    try {
        const allUsers = await getAllUsers();
        let availablePlayers = shuffleArray([...ALL_PLAYERS]);

        if (availablePlayers.length < allUsers.length * TEAM_SIZE) {
            return NextResponse.json({ message: 'Not enough players to assign to every user.' }, { status: 500 });
        }

        // Reset all user rosters first
        for (const user of allUsers) {
            user.players = [];
            user.roster = { lineup: [], bench: [] };
        }

        const assignedTeams: Player[][] = [];
        const maxAttempts = 100; // Prevent infinite loops

        for (let i = 0; i < allUsers.length; i++) {
            let attempts = 0;
            let team: Player[] = [];
            let teamCost = 0;
            
            while (attempts < maxAttempts) {
                // Fisher-Yates shuffle to get a random team
                let tempPlayers = [...availablePlayers];
                team = [];
                let currentTeamCost = 0;

                for (let j = 0; j < TEAM_SIZE; j++) {
                     if (tempPlayers.length === 0) break; // Should not happen with the check above
                     const playerIndex = Math.floor(Math.random() * tempPlayers.length);
                     const player = tempPlayers.splice(playerIndex, 1)[0];
                     team.push(player);
                     currentTeamCost += player.cost;
                }
                
                if (team.length === TEAM_SIZE && currentTeamCost >= TARGET_MIN_COST && currentTeamCost <= TARGET_MAX_COST) {
                    teamCost = currentTeamCost;
                    break;
                }
                attempts++;
            }
             if (teamCost === 0) {
                 // Fallback to snake draft if we can't find a perfect match
                console.warn(`Could not form a team within cost constraints for user ${i+1}. Falling back to simpler assignment for this user.`);
                team = availablePlayers.slice(0, TEAM_SIZE);
            }

            assignedTeams.push(team);
            // Remove assigned players from the available pool
            team.forEach(p => {
                const index = availablePlayers.findIndex(ap => ap.id === p.id);
                if (index > -1) {
                    availablePlayers.splice(index, 1);
                }
            });
        }
        
        allUsers.forEach((user, index) => {
            const team = assignedTeams[index];
            if (team) {
                user.players = team.map(p => ({ id: p.id, purchasedAt: Date.now() }));
                user.roster.lineup = team.map(p => p.id);
                user.roster.bench = [];
            }
        });

        await Promise.all(allUsers.map(user => updateUser(user)));

        return NextResponse.json({ message: `Starter teams assigned successfully to ${allUsers.length} users.` });

    } catch (error) {
        console.error('Failed to assign starter teams:', error);
        return NextResponse.json({ message: 'Error assigning starter teams' }, { status: 500 });
    }
}
