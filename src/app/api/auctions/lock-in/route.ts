'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { Player, User, UserPlayer } from '@/lib/types';
import { ALL_PLAYERS } from '@/data/players';
import { addNewsItem } from '@/lib/news-helpers';
import { USER_IDS } from '@/data/users';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');
const DAILY_MARKET_PATH = path.join(process.cwd(), 'src', 'data', 'daily_market.json');

async function getAllUsers(): Promise<User[]> {
    const userPromises = USER_IDS.map(async (userId) => {
        const filePath = path.join(USERS_DIR, `${userId}.json`);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content) as User;
        } catch (error) {
            console.warn(`Could not read or parse user file for ${userId}.json. Skipping.`);
            return null;
        }
    });
    const users = await Promise.all(userPromises);
    return users.filter((u): u is User => u !== null);
}

async function getMarketPlayers(): Promise<Player[]> {
  try {
    const fileContent = await fs.readFile(DAILY_MARKET_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Failed to read daily market file:", error);
    return [];
  }
}

async function saveUser(user: User): Promise<void> {
    const filePath = path.join(USERS_DIR, `${user.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(user, null, 2), 'utf-8');
}

export async function POST() {
  try {
    const allUsers = await getAllUsers();
    let marketPlayers = await getMarketPlayers();
    
    if (marketPlayers.length === 0) {
        return NextResponse.json({ message: 'Market is currently empty. Nothing to lock in.' });
    }
    
    const allBidsByPlayer: Record<string, { userId: string; userName: string; amount: number }[]> = {};
    const marketPlayerIds = new Set(marketPlayers.map(p => p.id));

    // Consolidate all bids for market players
    for (const user of allUsers) {
      if (user.bids) {
        for (const [playerId, bidAmount] of Object.entries(user.bids)) {
          if (marketPlayerIds.has(playerId)) {
            if (!allBidsByPlayer[playerId]) {
              allBidsByPlayer[playerId] = [];
            }
            allBidsByPlayer[playerId].push({ userId: user.id, userName: user.name, amount: bidAmount });
          }
        }
      }
    }

    let playersAwardedCount = 0;
    let totalCoinsSpent = 0;
    const messages: string[] = [];
    const awardedPlayerIds = new Set<string>();

    for (const [playerId, bids] of Object.entries(allBidsByPlayer)) {
        if (bids.length === 0) continue;

        bids.sort((a, b) => b.amount - a.amount);
        const winningBid = bids[0];
        
        // Find the winner's object in the main array to modify it directly
        const winnerIndex = allUsers.findIndex(u => u.id === winningBid.userId);
        if (winnerIndex === -1) continue;
        
        const winner = allUsers[winnerIndex];
        const playerInfo = ALL_PLAYERS.find(p => p.id === playerId);
        
        if (playerInfo) {
            // Check for edge cases
            if (winner.players.some(p => p.id === playerId)) {
                messages.push(`${winner.name} tried to bid on ${playerInfo.name}, but they already own this player.`);
                continue;
            }
            
            if (winner.players.length >= 10) {
                messages.push(`${winner.name} could not receive ${playerInfo.name} because their roster is full.`);
                continue;
            }

            if ((winner.currency ?? 0) < winningBid.amount) {
                messages.push(`${winner.name}'s bid for ${playerInfo.name} failed due to insufficient funds.`);
                continue;
            }
            
            // --- Perform Transaction on the correct user object ---
            winner.currency = (winner.currency ?? 0) - winningBid.amount;
            
            const newUserPlayer: UserPlayer = {
                id: playerId,
                purchasedAt: Date.now(),
                purchasePrice: winningBid.amount,
                clauseInvestment: 0
            };
            winner.players.push(newUserPlayer);
            
            if (winner.roster?.bench) {
                winner.roster.bench.push(playerId);
            } else {
                 winner.roster = { lineup: [], bench: [playerId] };
            }

            // --- Log results and mark for removal ---
            playersAwardedCount++;
            totalCoinsSpent += winningBid.amount;
            const winMessage = `${winner.name} won the auction for ${playerInfo.name} with a bid of ${winningBid.amount.toLocaleString()} coins!`;
            messages.push(winMessage);
            await addNewsItem('news.auction_win', [winner.name, playerInfo.name, winningBid.amount.toLocaleString()], '🎉');
            awardedPlayerIds.add(playerId);
        }
    }

    // Filter out awarded players from the market
    const remainingMarketPlayers = marketPlayers.filter(p => !awardedPlayerIds.has(p.id));
    await fs.writeFile(DAILY_MARKET_PATH, JSON.stringify(remainingMarketPlayers, null, 2), 'utf-8');

    // Clear all bids and save all users
    for (const user of allUsers) {
        user.bids = {};
        await saveUser(user);
    }
    
    const finalMessage = `Auction processing complete. ${playersAwardedCount} players awarded. Total coins spent: ${totalCoinsSpent.toLocaleString()}.`;

    return NextResponse.json({ message: finalMessage, details: messages });

  } catch (error: any) {
    console.error('Failed to lock in auctions:', error);
    return NextResponse.json({ message: `Error locking in auctions: ${error.message}` }, { status: 500 });
  }
}
