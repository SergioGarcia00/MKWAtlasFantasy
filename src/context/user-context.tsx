
'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
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
  purchasePlayer: (player: Player) => void;
  purchasePlayerByPeakMmr: (player: Player) => void;
  sellPlayer: (player: Player) => void;
  updateRoster: (lineup: string[], bench: string[]) => void;
  updateWeeklyScores: (playerId: string, weekId: string, scores: WeeklyScore) => void;
  switchUser: (userId: string) => void;
  buyoutPlayer: (player: Player, owner: User) => void;
  assignPlayer: (player: Player, targetUser: User, currentOwner?: User) => Promise<void>;
  getPlayerById: (playerId: string) => Player | undefined;
  loadAllData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const fetchJson = async (url: string) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to fetch ${url}`);
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

const updateUserInList = (users: User[], updatedUser: User): User[] => {
    return users.map(u => u.id === updatedUser.id ? updatedUser : u);
};


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
  
  const updateUserState = useCallback(async (updatedUser: User) => {
      try {
          const finalUserData = await postJson(`/api/users/${updatedUser.id}`, updatedUser);
          setUser(finalUserData);
          setAllUsers(prevUsers => updateUserInList(prevUsers, finalUserData));
          return finalUserData;
      } catch (error: any) {
          console.error("Update failed: ", error);
          toast({ title: 'Error', description: `Failed to update user data: ${error.message}`, variant: 'destructive' });
          return null;
      }
  }, [toast]);


  const switchUser = useCallback((userId: string) => {
    if (user?.id === userId) return;
    const userToSwitch = allUsers.find(u => u.id === userId);
    if (userToSwitch) {
      setUser(userToSwitch);
      localStorage.setItem(FANTASY_LEAGUE_ACTIVE_USER_ID, userId);
    }
  }, [allUsers, user?.id]);

  const purchasePlayer = useCallback(async (player: Player) => {
    if (!user || !allUsers) return;

    const isPlayerOwnedByAnyone = allUsers.some(anyUser => anyUser.players.some(p => p.id === player.id));
    if (isPlayerOwnedByAnyone) {
      toast({ title: 'Player Already Owned', description: `${player.name} has already been purchased.`, variant: 'destructive' });
      return;
    }
    
    if (user.players.length >= 10) {
      toast({ title: 'Roster Full', description: 'You cannot purchase more than 10 players.', variant: 'destructive' });
      return;
    }
    if (user.currency < player.cost) {
      toast({ title: 'Insufficient Funds', description: 'You do not have enough coins.', variant: 'destructive' });
      return;
    }

    const newUserPlayer: UserPlayer = { id: player.id, purchasedAt: Date.now() };
    const updatedUser = {
        ...user,
        currency: user.currency - player.cost,
        players: [...user.players, newUserPlayer],
        roster: { ...user.roster, bench: [...user.roster.bench, player.id] }
    };
    
    const finalUser = await updateUserState(updatedUser);
    if (finalUser) {
        toast({ title: 'Purchase Successful!', description: `${player.name} has been added to your bench.` });
    }
  }, [user, allUsers, toast, updateUserState]);

  const purchasePlayerByPeakMmr = useCallback(async (player: Player) => {
    if (!user || !allUsers) return;

    const isPlayerOwnedByAnyone = allUsers.some(anyUser => anyUser.players.some(p => p.id === player.id));
    if (isPlayerOwnedByAnyone) {
        toast({ title: 'Player Already Owned', description: `${player.name} is already owned.`, variant: 'destructive' });
        return;
    }
    if (user.players.length >= 10) {
        toast({ title: 'Roster Full', description: 'Your roster is full.', variant: 'destructive' });
        return;
    }
    const price = player.peak_mmr || player.cost;
    if (user.currency < price) {
        toast({ title: 'Insufficient Funds', description: 'Not enough coins.', variant: 'destructive' });
        return;
    }

    const newUserPlayer: UserPlayer = { id: player.id, purchasedAt: Date.now() };
    const updatedUser = {
        ...user,
        currency: user.currency - price,
        players: [...user.players, newUserPlayer],
        roster: { ...user.roster, bench: [...user.roster.bench, player.id] }
    };

    const finalUser = await updateUserState(updatedUser);
    if (finalUser) {
        toast({ title: 'Purchase Successful!', description: `${player.name} has been added to your bench.` });
    }
  }, [user, allUsers, toast, updateUserState]);

 const assignPlayer = useCallback(async (player: Player, targetUser: User, currentOwner?: User) => {
      if (targetUser.players.some(p => p.id === player.id)) {
        toast({ title: "Player Already Owned", description: `${targetUser.name} already owns this player.`, variant: "destructive"});
        return;
    }
    if (targetUser.players.length >= 10) {
        toast({ title: "Target Roster Full", description: `${targetUser.name}'s roster is full.`, variant: "destructive"});
        return;
    }

    const newUserPlayer: UserPlayer = { id: player.id, purchasedAt: Date.now() };

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
    const sellPrice = player.cost;
    const updatedUser: User = {
        ...user,
        currency: user.currency + sellPrice,
        players: user.players.filter(p => p.id !== player.id),
        roster: {
            lineup: user.roster.lineup.filter(id => id !== player.id),
            bench: user.roster.bench.filter(id => id !== player.id),
        }
    };
    const finalUser = await updateUserState(updatedUser);
    if (finalUser) {
        toast({ title: 'Player Sold!', description: `You sold ${player.name} for ${sellPrice.toLocaleString()} coins.` });
    }
  }, [user, toast, updateUserState]);

  const buyoutPlayer = useCallback(async (player: Player, owner: User) => {
    if (!user || !allUsers) return;
    const buyoutPrice = Math.round(player.cost * 1.5);
    if (user.currency < buyoutPrice) {
        toast({ title: 'Insufficient Funds', variant: 'destructive' });
        return;
    }
    if (user.players.length >= 10) {
        toast({ title: 'Roster Full', variant: 'destructive' });
        return;
    }

    const newUserPlayer: UserPlayer = { id: player.id, purchasedAt: Date.now() };
    const newOwnerUser = {
        ...user,
        currency: user.currency - buyoutPrice,
        players: [...user.players, newUserPlayer],
        roster: { ...user.roster, bench: [...user.roster.bench, player.id] }
    };
    await postJson(`/api/users/${newOwnerUser.id}`, newOwnerUser);

    const previousOwnerUser = {
        ...owner,
        currency: owner.currency + player.cost,
        players: owner.players.filter(p => p.id !== player.id),
        roster: {
            lineup: owner.roster.lineup.filter(id => id !== player.id),
            bench: owner.roster.bench.filter(id => id !== player.id),
        }
    };
    await postJson(`/api/users/${previousOwnerUser.id}`, previousOwnerUser);
    
    await loadAllData();
    toast({ title: 'Buyout Successful!', description: `You purchased ${player.name} from ${owner.name}!` });
  }, [user, allUsers, toast, loadAllData]);

  const updateRoster = useCallback(async (lineup: string[], bench: string[]) => {
    if (!user) return;
    const updatedUser = { ...user, roster: { lineup, bench } };
    const finalUser = await updateUserState(updatedUser);
    if (finalUser) {
        toast({ title: 'Roster Updated' });
    }
  }, [user, toast, updateUserState]);

  const updateWeeklyScores = useCallback(async (playerId: string, weekId: string, scores: WeeklyScore) => {
    if (!user) return;
    const updatedScores = {
        ...user.weeklyScores,
        [playerId]: { ...user.weeklyScores?.[playerId], [weekId]: scores }
    };
    const finalUser = await updateUserState({ ...user, weeklyScores: updatedScores });
    if(finalUser) {
        toast({ title: 'Scores Updated', description: `Scores for player ${playerId} for week ${weekId} saved.` });
    }
  }, [user, toast, updateUserState]);

  return (
    <UserContext.Provider value={{ user, allUsers, allPlayers: ALL_PLAYERS, purchasePlayer, purchasePlayerByPeakMmr, sellPlayer, updateRoster, updateWeeklyScores, switchUser, buyoutPlayer, getPlayerById, loadAllData, assignPlayer, isUserLoading: isDataLoading }}>
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

    
