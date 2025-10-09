'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { User, Player, WeeklyScore, UserPlayer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { USER_IDS } from '@/data/users';
import { ALL_PLAYERS } from '@/data/players';

const FANTASY_LEAGUE_ACTIVE_USER_ID = 'fantasy_league_active_user_id';

interface UserContextType {
  user: User | null;
  allUsers: User[];
  allPlayers: Player[];
  purchasePlayer: (player: Player) => void;
  updateRoster: (lineup: string[], bench: string[]) => void;
  updateWeeklyScores: (playerId: string, weekId: string, scores: WeeklyScore) => void;
  switchUser: (userId: string) => void;
  buyoutPlayer: (player: Player, owner: User) => void;
  getPlayerById: (playerId: string) => Player | undefined;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

async function fetchUser(userId: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      console.error(`Failed to fetch user ${userId}: ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return null;
  }
}

async function fetchAllUsers(): Promise<User[]> {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            console.error(`Failed to fetch all users: ${response.statusText}`);
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching all users:', error);
        return [];
    }
}

async function updateUser(user: User): Promise<User | null> {
    try {
        const response = await fetch(`/api/users/${user.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });
        if (!response.ok) {
            console.error(`Failed to update user ${user.id}: ${response.statusText}`);
            return null;
        }
        // The API now returns the dehydrated user, we need to re-hydrate it for the context
        const savedDehydratedUser = await response.json();
        return savedDehydratedUser; // This will be rehydrated in the provider
    } catch (error) {
        console.error(`Error updating user ${user.id}:`, error);
        return null;
    }
}


export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const getPlayerById = useCallback((playerId: string) => {
    return ALL_PLAYERS.find(p => p.id === playerId);
  }, []);

  const hydrateUser = useCallback((userToHydrate: User) => {
    const lineup = userToHydrate.roster.lineup.map(id => getPlayerById(id)).filter(p => p) as Player[];
    const bench = userToHydrate.roster.bench.map(id => getPlayerById(id)).filter(p => p) as Player[];
    return { ...userToHydrate, roster: { lineup, bench } };
  }, [getPlayerById]);


  const loadData = useCallback(async () => {
    const users = await fetchAllUsers();
    setAllUsers(users);

    const activeUserId = localStorage.getItem(FANTASY_LEAGUE_ACTIVE_USER_ID) || USER_IDS[0];
    const activeUser = users.find(u => u.id === activeUserId) || users[0] || null;
    
    if (activeUser) {
        setUser(activeUser);
        localStorage.setItem(FANTASY_LEAGUE_ACTIVE_USER_ID, activeUser.id);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const updateUserState = useCallback(async (updatedUser: User, otherUpdatedUser?: User) => {
    const userPromise = updateUser(updatedUser);
    const otherUserPromise = otherUpdatedUser ? updateUser(otherUpdatedUser) : Promise.resolve(null);
    
    await Promise.all([userPromise, otherUserPromise]);
    
    // After updating, reload all data to ensure consistency across the app
    await loadData();
    
  }, [toast, loadData]);


  const switchUser = useCallback((userId: string) => {
    const userToSwitch = allUsers.find(u => u.id === userId);
    if (userToSwitch) {
      setUser(userToSwitch);
      localStorage.setItem(FANTASY_LEAGUE_ACTIVE_USER_ID, userId);
    }
  }, [allUsers]);

  const purchasePlayer = useCallback(async (player: Player) => {
    if (!user) return;

    const isPlayerOwnedByAnyone = allUsers.some(anyUser =>
      anyUser.players.some(p => p.id === player.id)
    );

    if (isPlayerOwnedByAnyone) {
      toast({ title: 'Player Already Owned', description: `${player.name} has already been purchased by another user.`, variant: 'destructive' });
      return;
    }
    
    if (user.players.length >= 10) {
      toast({ title: 'Roster Full', description: 'You cannot purchase more than 10 players.', variant: 'destructive' });
      return;
    }
    if (user.currency < player.cost) {
      toast({ title: 'Insufficient Funds', description: 'You do not have enough coins to purchase this player.', variant: 'destructive' });
      return;
    }

    const newUserPlayer: UserPlayer = { id: player.id, purchasedAt: Date.now() };

    const updatedUser = {
        ...user,
        currency: user.currency - player.cost,
        players: [...user.players, newUserPlayer],
        roster: {
            ...user.roster,
            bench: [...user.roster.bench, player.id]
        }
    };
    
    toast({ title: 'Purchase Successful!', description: `${player.name} has been added to your bench.` });
    await updateUserState(updatedUser);
  }, [user, allUsers, toast, updateUserState]);

  const buyoutPlayer = useCallback(async (player: Player, owner: User) => {
    if (!user) return;

    const buyoutPrice = Math.round(player.cost * 1.5);
    if (user.currency < buyoutPrice) {
        toast({ title: 'Insufficient Funds', description: 'You cannot afford the buyout price.', variant: 'destructive' });
        return;
    }
    if (user.players.length >= 10) {
        toast({ title: 'Roster Full', description: 'Your roster is full.', variant: 'destructive' });
        return;
    }

    const newUserPlayer: UserPlayer = { id: player.id, purchasedAt: Date.now() };

    // New owner (current user)
    const newOwnerUser = {
        ...user,
        currency: user.currency - buyoutPrice,
        players: [...user.players, newUserPlayer],
        roster: { ...user.roster, bench: [...user.roster.bench, player.id] }
    };

    // Previous owner
    const previousOwnerUser = {
        ...owner,
        currency: owner.currency + player.cost, // Refund original cost
        players: owner.players.filter(p => p.id !== player.id),
        roster: {
            lineup: owner.roster.lineup.filter(id => id !== player.id),
            bench: owner.roster.bench.filter(id => id !== player.id),
        }
    };
    
    toast({ title: 'Buyout Successful!', description: `You have purchased ${player.name} from ${owner.name}!` });
    await updateUserState(newOwnerUser, previousOwnerUser);

  }, [user, toast, updateUserState]);

  const updateRoster = useCallback(async (lineup: string[], bench: string[]) => {
    if (!user) return;
    const updatedUser: User = {
        ...user,
        roster: { lineup, bench },
    };
    toast({ title: 'Roster Updated', description: 'Your lineup and bench have been saved.' });
    await updateUserState(updatedUser);
  }, [user, toast, updateUserState]);

  const updateWeeklyScores = useCallback(async (playerId: string, weekId: string, scores: WeeklyScore) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      weeklyScores: {
        ...user.weeklyScores,
        [playerId]: {
          ...user.weeklyScores?.[playerId],
          [weekId]: scores,
        }
      },
    };
    toast({ title: 'Scores Updated', description: `Scores for player ${playerId} for week ${weekId} have been saved.` });
    await updateUserState(updatedUser);
  }, [user, toast, updateUserState]);

  return (
    <UserContext.Provider value={{ user, allUsers, allPlayers: ALL_PLAYERS, purchasePlayer, updateRoster, updateWeeklyScores, switchUser, buyoutPlayer, getPlayerById }}>
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
