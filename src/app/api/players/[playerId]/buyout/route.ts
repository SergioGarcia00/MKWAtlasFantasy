'use server';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ALL_PLAYERS } from '@/data/players';
import type { User, UserPlayer } from '@/lib/types';
import { differenceInDays } from 'date-fns';
import { addNewsItem } from '@/lib/news-helpers';

const USERS_DIR = path.join(process.cwd(), 'src', 'data', 'users');

async function getUser(userId: string): Promise<User> {
    const filePath = path.join(USERS_DIR, `${userId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
}

async function saveUser(user: User): Promise<void> {
    const filePath = path.join(USERS_DIR, `${user.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(user, null, 2), 'utf-8');
}

export async function POST(request: Request, { params }: { params: { playerId: string } }) {
    try {
        const { playerId } = params;
        const { buyerId, ownerId } = await request.json();

        if (!buyerId || !ownerId) {
            return NextResponse.json({ message: 'Buyer and Owner IDs are required' }, { status: 400 });
        }
        if (buyerId === ownerId) {
            return NextResponse.json({ message: 'Cannot buyout a player you already own.' }, { status: 400 });
        }
        
        const playerInfo = ALL_PLAYERS.find(p => p.id === playerId);
        if (!playerInfo) {
            return NextResponse.json({ message: 'Player not found' }, { status: 404 });
        }

        const buyer = await getUser(buyerId);
        const owner = await getUser(ownerId);
        
        const ownerPlayerIndex = owner.players.findIndex(p => p.id === playerId);
        if (ownerPlayerIndex === -1) {
            return NextResponse.json({ message: 'Player not owned by the specified owner' }, { status: 400 });
        }

        const ownerPlayer = owner.players[ownerPlayerIndex];
        const daysSincePurchase = differenceInDays(new Date(), new Date(ownerPlayer.purchasedAt));
        if (daysSincePurchase < 14) {
             return NextResponse.json({ message: `This player is protected from buyout for ${14 - daysSincePurchase} more day(s).` }, { status: 403 });
        }

        const baseBuyoutPrice = playerInfo.cost;
        const totalBuyoutPrice = baseBuyoutPrice + (ownerPlayer.clauseInvestment || 0);

        if (buyer.players.length >= 10) {
            return NextResponse.json({ message: 'Your roster is full.' }, { status: 400 });
        }
        if (buyer.currency < totalBuyoutPrice) {
            return NextResponse.json({ message: 'Insufficient funds for buyout.' }, { status: 400 });
        }

        // --- Perform transaction ---

        // 1. Handle Buyer
        buyer.currency -= totalBuyoutPrice;
        const newPlayerForBuyer: UserPlayer = {
            id: playerId,
            purchasedAt: Date.now(),
            purchasePrice: totalBuyoutPrice, // Buyer pays the full buyout price
            clauseInvestment: 0
        };
        buyer.players.push(newPlayerForBuyer);
        if (buyer.roster && !buyer.roster.bench.includes(playerId)) {
            buyer.roster.bench.push(playerId);
        } else if (!buyer.roster) {
            buyer.roster = { lineup: [], bench: [playerId] };
        }


        // 2. Handle Owner
        const refundAmount = typeof ownerPlayer.purchasePrice === 'number' ? ownerPlayer.purchasePrice : playerInfo.cost;
        owner.currency = (owner.currency || 0) + refundAmount + (ownerPlayer.clauseInvestment || 0); // Refund purchase price AND clause investment
        owner.players.splice(ownerPlayerIndex, 1);
        owner.roster.lineup = owner.roster.lineup.filter(id => id !== playerId);
        owner.roster.bench = owner.roster.bench.filter(id => id !== playerId);

        // 3. Save changes
        await saveUser(buyer);
        await saveUser(owner);
        
        // 4. Add news item
        await addNewsItem('news.buyout', [buyer.name, playerInfo.name, owner.name, totalBuyoutPrice.toLocaleString()], '🔄');

        return NextResponse.json({ message: `Successfully bought out ${playerInfo.name} from ${owner.name}` });

    } catch (error: any) {
        console.error('Failed to buyout player:', error);
        return NextResponse.json({ message: `Error buying out player: ${error.message}` }, { status: 500 });
    }
}
