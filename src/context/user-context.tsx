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

const fetchJson = async (url: string) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch ${url}`);
    }
    return response.json();
}

const postJson = async (url: string, data: any) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
     if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to post to ${url}`);
    }
    return response.json();
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();

  const getPlayerById = useCallback((playerId: string) => {
    return ALL_PLAYERS.find(p => p.id === playerId);
  }, []);

  const loadAllData = useCallback(async () => {
    setIsDataLoading(true);
    try {
        const users = await Promise.all(USER_IDS.map(id => fetchJson(`/api/users/${id}`)));
        setAllUsers(users);

        const activeUserId = localStorage.getItem(FANTASY_LEAGUE_ACTIVE_USER_ID) || users[0]?.id;
        const activeUser = users.find(u => u.id === activeUserId) || users[0] || null;
        if (activeUser) {
          setUser(activeUser);
        }
    } catch (error: any) {
        console.error("Failed to load all data:", error);
        toast({ title: 'Error Loading Data', description: error.message, variant: 'destructive' });
    } finally {
        setIsDataLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);
  
  const updateUserOnServer = useCallback(async (updatedUser: Partial<User> & { id: string }) => {
    try {
      await postJson(`/api/users/${updatedUser.id}`, updatedUser);
      await loadAllData(); 
    } catch (error: any) {
      console.error("Update failed: ", error);
      toast({ title: 'Error', description: `Failed to update user data: ${error.message}`, variant: 'destructive' });
      await loadAllData(); 
      throw error;
    }
  }, [toast, loadAllData]);

  const switchUser = useCallback((userId: string) => {
    if (user?.id === userId) return;
    const userToSwitch = allUsers.find(u => u.id === userId);
    if (userToSwitch) {
      setUser(userToSwitch);
      localStorage.setItem(FANTASY_LEAGUE_ACTIVE_USER_ID, userId);
    }
  }, [allUsers, user?.id]);

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

    const newUserPlayer: UserPlayer = { id: player.id, purchasedAt: Date.now(), purchasePrice: player.cost };
    const updatedUser = {
        id: user.id,
        currency: user.currency - player.cost,
        players: [...user.players, newUserPlayer],
        roster: { ...user.roster, bench: [...user.roster.bench, player.id] }
    };
    
    try {
        await updateUserOnServer(updatedUser);
        toast({ title: 'Purchase Successful!', description: `${player.name} has been added to your bench.` });
    } catch (e) { /* error already handled */ }
  }, [user, toast, updateUserOnServer]);

  const purchasePlayerByPeakMmr = useCallback(async (player: Player) => {
    if (!user) return;
    if (user.players.length >= 10) {
        toast({ title: 'Roster Full', description: 'Your roster is full.', variant: 'destructive' });
        return;
    }
    const price = player.peak_mmr || player.cost;
    if (user.currency < price) {
        toast({ title: 'Insufficient Funds', description: 'Not enough coins.', variant: 'destructive' });
        return;
    }

    const newUserPlayer: UserPlayer = { id: player.id, purchasedAt: Date.now(), purchasePrice: price };
    const updatedUser = {
        id: user.id,
        currency: user.currency - price,
        players: [...user.players, newUserPlayer],
        roster: { ...user.roster, bench: [...user.roster.bench, player.id] }
    };

    try {
        await updateUserOnServer(updatedUser);
        toast({ title: 'Purchase Successful!', description: `${player.name} has been added to your bench.` });
    } catch(e) { /* error already handled */ }
  }, [user, toast, updateUserOnServer]);

 const assignPlayer = useCallback(async (player: Player, targetUser: User, currentOwner?: User) => {
    if (targetUser.players.some(p => p.id === player.id)) {
        toast({ title: "Player Already Owned", description: `${targetUser.name} already owns this player.`, variant: "destructive"});
        return;
    }
    if (targetUser.players.length >= 10) {
        toast({ title: "Target Roster Full", description: `${targetUser.name}'s roster is full.`, variant: "destructive"});
        return;
    }

    const newUserPlayer: UserPlayer = { id: player.id, purchasedAt: Date.now(), purchasePrice: player.cost };

    const updatedTargetUser = {
        ...targetUser,
        players: [...targetUser.players, newUserPlayer],
        roster: { ...targetUser.roster, bench: [...targetUser.roster.bench, player.id] }
    };
    await postJson(`/api/users/${updatedTargetUser.id}`, updatedTargetUser);

    if (currentOwner) {
        const updatedOwnerUser = {
            ...currentOwner,
            players: currentOwner.players.filter(p => p.id !== player.id),
            roster: {
                lineup: currentOwner.roster.lineup.filter(id => id !== player.id),
                bench: currentOwner.roster.bench.filter(id => id !== player.id),
            }
        };
       await postJson(`/api/users/${updatedOwnerUser.id}`, updatedOwnerUser);
    }
    
    await loadAllData();
    toast({ title: "Player Assigned!", description: `${player.name} has been given to ${targetUser.name}.`});
  }, [toast, loadAllData]);

  const sellPlayer = useCallback(async (player: Player) => {
    if (!user) return;
    const playerToSell = user.players.find(p => p.id === player.id);
    if (!playerToSell) {
      toast({ title: 'Player not found', description: 'Could not find this player in your roster.', variant: 'destructive'});
      return;
    }
    const sellPrice = playerToSell.purchasePrice || player.cost; // Fallback to base cost

    const updatedUser = {
        id: user.id,
        currency: user.currency + sellPrice,
        players: user.players.filter(p => p.id !== player.id),
        roster: {
            lineup: user.roster.lineup.filter(id => id !== player.id),
            bench: user.roster.bench.filter(id => id !== player.id),
        }
    };
    try {
        await updateUserOnServer(updatedUser);
        toast({ title: 'Player Sold!', description: `You sold ${player.name} for ${sellPrice.toLocaleString()} coins.` });
    } catch (e) { /* error already handled */ }
  }, [user, toast, updateUserOnServer]);

  const buyoutPlayer = useCallback(async (player: Player, owner: User) => {
    if (!user) return;
    
    const ownerPlayerInfo = owner.players.find(p => p.id === player.id);
    const clauseInvestment = ownerPlayerInfo?.clauseInvestment || 0;
    const buyoutPrice = player.cost + (clauseInvestment * 2);

    if (user.currency < buyoutPrice) {
        toast({ title: 'Insufficient Funds', variant: 'destructive' });
        return;
    }
    if (user.players.length >= 10) {
        toast({ title: 'Roster Full', variant: 'destructive' });
        return;
    }

    try {
        // Step 1: Update the new owner
        const newUserPlayer: UserPlayer = { id: player.id, purchasedAt: Date.now(), purchasePrice: buyoutPrice };
        const newOwnerUser = {
            ...user,
            currency: user.currency - buyoutPrice,
            players: [...user.players, newUserPlayer],
            roster: { ...user.roster, bench: [...user.roster.bench, player.id] }
        };
        await postJson(`/api/users/${newOwnerUser.id}`, newOwnerUser);
        
        // Step 2: Update the previous owner
        const previousOwnerUser = {
            ...owner,
            currency: owner.currency + (ownerPlayerInfo?.purchasePrice || player.cost),
            players: owner.players.filter(p => p.id !== player.id),
            roster: {
                lineup: owner.roster.lineup.filter(id => id !== player.id),
                bench: owner.roster.bench.filter(id => id !== player.id),
            }
        };
        await postJson(`/api/users/${previousOwnerUser.id}`, previousOwnerUser);
        
        await loadAllData();
        toast({ title: 'Buyout Successful!', description: `You purchased ${player.name} from ${owner.name}!` });
    } catch(e) {
         toast({ title: 'Buyout Failed', description: 'Could not complete the transaction.', variant: 'destructive'});
    }
  }, [user, toast, loadAllData]);

  const increaseBuyoutClause = useCallback(async (playerId: string, investmentAmount: number) => {
    if (!user) return;
    if (user.currency < investmentAmount) {
      toast({ title: 'Insufficient Funds', description: 'You do not have enough coins for this investment.', variant: 'destructive' });
      return;
    }

    const updatedPlayers = user.players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          clauseInvestment: (p.clauseInvestment || 0) + investmentAmount
        };
      }
      return p;
    });

    const updatedUser = {
      id: user.id,
      currency: user.currency - investmentAmount,
      players: updatedPlayers
    };

    try {
      await updateUserOnServer(updatedUser);
      toast({ title: 'Clause Increased!', description: `You invested ${investmentAmount.toLocaleString()} coins in ${getPlayerById(playerId)?.name}.` });
    } catch (e) { /* error handled in updateUserOnServer */ }
  }, [user, toast, updateUserOnServer, getPlayerById]);


  const updateRoster = useCallback(async (lineup: string[], bench: string[]) => {
    if (!user) return;
    const updatedUser = { id: user.id, roster: { lineup, bench } };
    try {
        await updateUserOnServer(updatedUser);
        toast({ title: 'Roster Updated' });
    } catch (e) { /* error handled */ }
  }, [user, toast, updateUserOnServer]);

  const updateWeeklyScores = useCallback(async (playerId: string, weekId: string, scores: WeeklyScore) => {
    if (!user) return;
    const updatedScores = {
        ...user.weeklyScores,
        [playerId]: { ...user.weeklyScores?.[playerId], [weekId]: scores }
    };
    try {
        await updateUserOnServer({ id: user.id, weeklyScores: updatedScores });
        toast({ title: 'Scores Updated', description: `Scores for player ${playerId} for week ${weekId} saved.` });
    } catch (e) { /* error handled */ }
  }, [user, toast, updateUserOnServer]);

  return (
    <UserContext.Provider value={{ user, allUsers, allPlayers: ALL_PLAYERS, purchasePlayer, purchasePlayerByPeakMmr, sellPlayer, updateRoster, updateWeeklyScores, switchUser, buyoutPlayer, getPlayerById, loadAllData, assignPlayer, increaseBuyoutClause, isUserLoading: isDataLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
