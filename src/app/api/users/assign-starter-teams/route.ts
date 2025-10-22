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

// Helper function to calculate team cost
const getTeamCost = (team: Player[]): number => team.reduce((sum, player) => sum + player.cost, 0);

export async function POST(request: Request) {
    try {
        const allUsers = await getAllUsers();
        let availablePlayers = shuffleArray([...ALL_PLAYERS]);

        if (availablePlayers.length < allUsers.length * TEAM_SIZE) {
            return NextResponse.json({ message: 'Not enough players to assign to every user.' }, { status: 500 });
        }

        // Assign initial teams by dealing players
        let assignedTeams: Player[][] = Array.from({ length: allUsers.length }, () => []);
        for (let i = 0; i < TEAM_SIZE; i++) {
            for (let j = 0; j < allUsers.length; j++) {
                if (availablePlayers.length > 0) {
                    assignedTeams[j].push(availablePlayers.pop()!);
                }
            }
        }
        
        let teamsWithCosts = assignedTeams.map(team => ({
            team,
            cost: getTeamCost(team)
        }));

        const MAX_ITERATIONS = 5000;
        let iterations = 0;

        // Iteratively balance teams
        while (iterations < MAX_ITERATIONS) {
            teamsWithCosts.sort((a, b) => a.cost - b.cost);
            const cheapestTeam = teamsWithCosts[0];
            const mostExpensiveTeam = teamsWithCosts[teamsWithCosts.length - 1];

            if (cheapestTeam.cost >= TARGET_MIN_COST && mostExpensiveTeam.cost <= TARGET_MAX_COST) {
                // All teams are balanced
                break;
            }

            let bestSwap: { cheapPlayer: Player, expensivePlayer: Player, improvement: number } | null = null;
            
            // Find the best player swap between the cheapest and most expensive teams
            for (const cheapPlayer of cheapestTeam.team) {
                for (const expensivePlayer of mostExpensiveTeam.team) {
                    const costDifference = expensivePlayer.cost - cheapPlayer.cost;
                    if (costDifference > 0) {
                        const newCheapestCost = cheapestTeam.cost + costDifference;
                        const newExpensiveCost = mostExpensiveTeam.cost - costDifference;
                        
                        // Check if this swap moves teams towards the target range
                        const currentGap = mostExpensiveTeam.cost - cheapestTeam.cost;
                        const newGap = Math.abs(newExpensiveCost - newCheapestCost);

                        if (newGap < currentGap && (!bestSwap || costDifference > (bestSwap.expensivePlayer.cost - bestSwap.cheapPlayer.cost))) {
                            bestSwap = { cheapPlayer, expensivePlayer, improvement: currentGap - newGap };
                        }
                    }
                }
            }

            if (bestSwap) {
                // Perform the swap
                const cheapIndex = cheapestTeam.team.indexOf(bestSwap.cheapPlayer);
                const expensiveIndex = mostExpensiveTeam.team.indexOf(bestSwap.expensivePlayer);
                
                cheapestTeam.team[cheapIndex] = bestSwap.expensivePlayer;
                mostExpensiveTeam.team[expensiveIndex] = bestSwap.cheapPlayer;

                // Recalculate costs
                cheapestTeam.cost = getTeamCost(cheapestTeam.team);
                mostExpensiveTeam.cost = getTeamCost(mostExpensiveTeam.team);
            } else {
                // No beneficial swap found, break to avoid infinite loop
                break;
            }

            iterations++;
        }

        if (iterations === MAX_ITERATIONS) {
             console.warn("Could not fully balance all teams within the iteration limit.");
        }


        // Final assignment to users
        allUsers.forEach((user, index) => {
            const team = teamsWithCosts[index]?.team;
            if (team) {
                user.players = team.map(p => ({ id: p.id, purchasedAt: Date.now(), purchasePrice: p.cost }));
                user.roster.lineup = team.map(p => p.id);
                user.roster.bench = [];
            } else {
                 user.players = [];
                 user.roster = { lineup: [], bench: [] };
            }
        });

        await Promise.all(allUsers.map(user => updateUser(user)));

        return NextResponse.json({ message: `Starter teams assigned successfully to ${allUsers.length} users.` });

    } catch (error) {
        console.error('Failed to assign starter teams:', error);
        return NextResponse.json({ message: 'Error assigning starter teams' }, { status: 500 });
    }
}
