'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { User, Player, WeeklyScore, UserPlayer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ALL_PLAYERS } from '@/data/players';
import { USER_IDS } from '@/data/users';

const FANTASY_LEAGUE_ACTIVE_USER_ID = 'fantasy_league_active_user_id';

interface UserContextType {
  user: User | null;
  isUserLoading: boolean;
  allUsers: User[];
  allPlayers: Player[];
  purchasePlayer: (player: Player) => Promise<void>;
  purchasePlayerByPeakMmr: (player: Player) => Promise<void>;
  sellPlayer: (player: Player) => Promise<void>;
  updateRoster: (lineup: string[], bench: string[]) => Promise<void>;
  updateWeeklyScores: (playerId: string, weekId: string, scores: WeeklyScore) => Promise<void>;
  switchUser: (userId: string) => void;
  buyoutPlayer: (player: Player, owner: User) => Promise<void>;
  assignPlayer: (player: Player, targetUser: User, currentOwner?: User) => Promise<void>;
  getPlayerById: (playerId: string) => Player | undefined;
  loadAllData: () => Promise<void>;
  increaseBuyoutClause: (playerId: string, investmentAmount: number) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

async function fetchAllUsers(): Promise<User[]> {
    const users = await Promise.all(USER_IDS.map(async (id) => {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
            console.error(`Failed to fetch user ${id}`);
            return null;
        }
        return response.json();
    }));
    return users.filter((user): user is User => user !== null);
}

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const { toast } = useToast();

    const loadAllData = useCallback(async () => {
        setIsUserLoading(true);
        try {
            const users = await fetchAllUsers();
            setAllUsers(users);

            const storedUserId = localStorage.getItem(FANTASY_LEAGUE_ACTIVE_USER_ID);
            const currentUser = users.find(u => u.id === storedUserId) || users[0] || null;
            
            setUser(currentUser);
            if (currentUser) {
                localStorage.setItem(FANTASY_LEAGUE_ACTIVE_USER_ID, currentUser.id);
            }

        } catch (error) {
            console.error("Failed to load user data", error);
            toast({
                title: 'Error',
                description: 'Could not load user data.',
                variant: 'destructive',
            });
        } finally {
            setIsUserLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    const switchUser = useCallback((userId: string) => {
        if (user?.id === userId) return;
        const userToSwitch = allUsers.find(u => u.id === userId);
        if (userToSwitch) {
            setUser(userToSwitch);
            localStorage.setItem(FANTASY_LEAGUE_ACTIVE_USER_ID, userId);
        } else {
            console.warn(`User with id ${userId} not found.`);
        }
    }, [allUsers, user?.id]);

    const getPlayerById = useCallback((playerId: string) => {
        return ALL_PLAYERS.find(p => p.id === playerId);
    }, []);

    const purchasePlayer = useCallback(async (player: Player) => {
        if (!user) return;
         if (user.players.length >= 10) {
            toast({ title: 'Roster Full', description: 'You cannot purchase more than 10 players.', variant: 'destructive' });
            return;
        }
        if (user.currency < player.cost) {
            toast({ title: 'Insufficient Funds', description: 'You do not have enough coins.', variant: 'destructive' });
            return;
        }

        try {
            const response = await fetch(`/api/players/${player.id}/buy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to purchase player');
            }
            toast({ title: 'Purchase Successful!', description: `${player.name} has been added to your bench.` });
            await loadAllData();
        } catch (error: any) {
            toast({ title: 'Purchase Failed', description: error.message, variant: 'destructive' });
        }
    }, [user, toast, loadAllData]);

     const purchasePlayerByPeakMmr = useCallback(async (player: Player) => {
        if (!user) return;
         if (user.players.length >= 10) {
            toast({ title: 'Roster Full', description: 'You cannot purchase more than 10 players.', variant: 'destructive' });
            return;
        }
        if (user.currency < player.cost) {
            toast({ title: 'Insufficient Funds', description: 'You do not have enough coins.', variant: 'destructive' });
            return;
        }

        try {
            const response = await fetch(`/api/players/${player.peak_mmr}/buy-by-mmr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to purchase player');
            }
            toast({ title: 'Purchase Successful!', description: `${player.name} has been added to your bench.` });
            await loadAllData();
        } catch (error: any) {
            toast({ title: 'Purchase Failed', description: error.message, variant: 'destructive' });
        }
    }, [user, toast, loadAllData]);

    const sellPlayer = useCallback(async (player: Player) => {
        if (!user) return;
        const userPlayer = user.players.find(p => p.id === player.id);
        if (!userPlayer) return;

        try {
            const response = await fetch(`/api/players/${player.id}/sell`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to sell player');
            }
            toast({ title: 'Player Sold!', description: `You received ${userPlayer.purchasePrice.toLocaleString()} for ${player.name}.` });
            await loadAllData();
        } catch (error: any) {
            toast({ title: 'Sale Failed', description: error.message, variant: 'destructive' });
        }
    }, [user, toast, loadAllData]);

    const updateRoster = useCallback(async (lineup: string[], bench: string[]) => {
        if (!user) return;
        try {
            const response = await fetch(`/api/users/${user.id}/roster`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lineup, bench }),
            });
             if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update roster');
            }
            toast({ title: 'Roster Updated' });
            await loadAllData();
        } catch (e: any) {
             toast({ title: 'Roster Update Failed', description: e.message, variant: 'destructive' });
        }
    }, [user, toast, loadAllData]);

    const updateWeeklyScores = useCallback(async (playerId: string, weekId: string, scores: WeeklyScore) => {
        if (!user) return;
        try {
            const response = await fetch(`/api/users/${user.id}/scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId, weekId, scores }),
            });
            if (!response.ok) {
                 const error = await response.json();
                throw new Error(error.message || 'Failed to update scores');
            }
            toast({ title: 'Scores Updated', description: `Scores for ${getPlayerById(playerId)?.name} for week ${weekId} saved.` });
            await loadAllData();
        } catch (e: any) {
            toast({ title: 'Score Update Failed', description: e.message, variant: 'destructive' });
        }
    }, [user, getPlayerById, toast, loadAllData]);
    
    const buyoutPlayer = useCallback(async (player: Player, owner: User) => {
        if (!user) return;
        try {
            const response = await fetch(`/api/players/${player.id}/buyout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buyerId: user.id, ownerId: owner.id }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to buyout player');
            }
            toast({ title: 'Buyout Successful!', description: `You have acquired ${player.name} from ${owner.name}!` });
            await loadAllData();
        } catch (e: any) {
            toast({ title: 'Buyout Failed', description: e.message, variant: 'destructive' });
        }
    }, [user, toast, loadAllData]);

    const assignPlayer = useCallback(async (player: Player, targetUser: User, currentOwner?: User) => {
        try {
             const response = await fetch(`/api/players/${player.id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    targetUserId: targetUser.id, 
                    currentOwnerId: currentOwner?.id 
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to assign player');
            }
            toast({ title: 'Player Assigned!', description: `${player.name} has been assigned to ${targetUser.name}.` });
            await loadAllData();
        } catch (e: any) {
            toast({ title: 'Assignment Failed', description: e.message, variant: 'destructive' });
        }
    }, [toast, loadAllData]);

    const increaseBuyoutClause = useCallback(async (playerId: string, investmentAmount: number) => {
        if (!user) return;
        try {
            const response = await fetch(`/api/players/${playerId}/invest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, amount: investmentAmount }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to invest');
            }
            toast({ title: 'Investment Successful!', description: `You invested ${investmentAmount.toLocaleString()} to increase ${getPlayerById(playerId)?.name}'s buyout clause.` });
            await loadAllData();
        } catch (e: any) {
            toast({ title: 'Investment Failed', description: e.message, variant: 'destructive' });
        }
    }, [user, getPlayerById, toast, loadAllData]);


    const value = {
        user,
        isUserLoading,
        allUsers,
        allPlayers: ALL_PLAYERS,
        purchasePlayer,
        purchasePlayerByPeakMmr,
        sellPlayer,
        updateRoster,
        updateWeeklyScores,
        switchUser,
        buyoutPlayer,
        assignPlayer,
        getPlayerById,
        loadAllData,
        increaseBuyoutClause
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
