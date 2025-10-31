'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { Player, User, UserPlayer } from '@/lib/types';
import { ALL_PLAYERS } from '@/data/players';
import { addNewsItem } from '@/lib/news-helpers';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');
const DAILY_MARKET_PATH = path.join(process.cwd(), 'src', 'data', 'daily_market.json');

async function getAllUsers(): Promise<User[]> {
  try {
    const filenames = await fs.readdir(USERS_DIR);
    const users = await Promise.all(
      filenames
        .filter(filename => filename.endsWith('.json'))
        .map(async (filename) => {
            const filePath = path.join(USERS_DIR, filename);
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                return JSON.parse(content) as User;
            } catch (error) {
                console.warn(`Could not read or parse user file for ${filename}. Skipping.`);
                return null;
            }
        })
    );
    return users.filter((u): u is User => u !== null);
  } catch (error) {
    console.error("Failed to read user files:", error);
    return [];
  }
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
    let allUsers = await getAllUsers();
    const marketPlayers = await getMarketPlayers();
    
    // Step 1: Collect all bids from all users for players *currently in the market*
    const allBidsByPlayer: Record<string, { userId: string; amount: number }[]> = {};
    const marketPlayerIds = new Set(marketPlayers.map(p => p.id));

    for (const user of allUsers) {
      if (user.bids) {
        for (const [playerId, bidAmount] of Object.entries(user.bids)) {
          if (marketPlayerIds.has(playerId)) {
            if (!allBidsByPlayer[playerId]) {
              allBidsByPlayer[playerId] = [];
            }
            allBidsByPlayer[playerId].push({ userId: user.id, amount: bidAmount });
          }
        }
      }
    }

    let playersAwardedCount = 0;
    let totalCoinsSpent = 0;
    const messages: string[] = [];

    // Step 2: Process each player auction for players in the market
    for (const [playerId, bids] of Object.entries(allBidsByPlayer)) {
        if (bids.length === 0) continue;

        // Sort bids to find the highest
        bids.sort((a, b) => b.amount - a.amount);
        const winningBid = bids[0];
        
        const winnerIndex = allUsers.findIndex(u => u.id === winningBid.userId);
        if (winnerIndex === -1) continue;

        let winner = allUsers[winnerIndex];
        const playerInfo = ALL_PLAYERS.find(p => p.id === playerId);
        
        if (winner && playerInfo) {
            // Check if winner already owns this player
            if (winner.players.some(p => p.id === playerId)) {
                messages.push(`${winner.name} tried to bid on ${playerInfo.name}, but they already own this player.`);
                continue;
            }
            
             // Check if winner's roster is full
            if (winner.players.length >= 10) {
                messages.push(`${winner.name} could not receive ${playerInfo.name} because their roster is full.`);
                continue;
            }

            // Check if winner can afford it
            if ((winner.currency || 0) < winningBid.amount) {
                messages.push(`${winner.name}'s bid for ${playerInfo.name} failed due to insufficient funds.`);
                continue;
            }
            
            // Award player to winner
            winner.currency = (winner.currency || 0) - winningBid.amount;
            const newUserPlayer: UserPlayer = {
                id: playerId,
                purchasedAt: Date.now(),
                purchasePrice: winningBid.amount,
                clauseInvestment: 0
            };
            winner.players.push(newUserPlayer);
            if (!winner.roster.bench.includes(playerId)) {
                winner.roster.bench.push(playerId);
            }
            
            // Update the user in the main array
            allUsers[winnerIndex] = winner;

            playersAwardedCount++;
            totalCoinsSpent += winningBid.amount;
            const winMessage = `${winner.name} won the auction for ${playerInfo.name} with a bid of ${winningBid.amount.toLocaleString()} coins!`;
            messages.push(winMessage);
            await addNewsItem('news.auction_win', [winner.name, playerInfo.name, winningBid.amount.toLocaleString()], '🎉');
        }
    }
    
    // Step 3: Clear all bids from all users and save their updated data
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
