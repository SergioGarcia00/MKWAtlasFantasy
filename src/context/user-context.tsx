'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import type { User, Player, WeeklyScore, UserPlayer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ALL_PLAYERS } from '@/data/players';
import { useFirestore, useUser as useFirebaseAuth, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const FANTASY_LEAGUE_ACTIVE_USER_ID = 'fantasy_league_active_user_id';

interface UserContextType {
  user: User | null;
  allUsers: User[];
  allPlayers: Player[];
  purchasePlayer: (player: Player) => void;
  purchasePlayerByPeakMmr: (player: Player) => void;
  sellPlayer: (player: Player) => void;
  updateRoster: (lineup: string[], bench: string[]) => void;
  updateWeeklyScores: (playerId: string, weekId: string, scores: WeeklyScore) => void;
  switchUser: (userId: string, force?: boolean) => void;
  buyoutPlayer: (player: Player, owner: User) => void;
  assignPlayer: (player: Player, targetUser: User, currentOwner?: User) => Promise<void>;
  getPlayerById: (playerId: string) => Player | undefined;
  loadAllData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useFirebaseAuth();

  const getPlayerById = useCallback((playerId: string) => {
    return ALL_PLAYERS.find(p => p.id === playerId);
  }, []);

  const loadAllData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const users: User[] = await response.json();
      setAllUsers(users);

      // After fetching, set the active user
      const activeUserId = localStorage.getItem(FANTASY_LEAGUE_ACTIVE_USER_ID) || users[0]?.id;
      const activeUser = users.find(u => u.id === activeUserId) || users[0] || null;
      if (activeUser) {
        setUser(activeUser);
      }

    } catch (error) {
      console.error("Failed to load all data:", error);
      toast({ title: 'Error Loading Data', description: 'Could not load fantasy league data.', variant: 'destructive' });
    } finally {
      setIsDataLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);
  
  const updateUserState = useCallback(async (usersToUpdate: User[]) => {
    const batch = writeBatch(firestore);
    
    usersToUpdate.forEach(updatedUser => {
      const userRef = doc(firestore, 'users', updatedUser.id);
      batch.set(userRef, updatedUser);
    });

    try {
      await batch.commit();
      // After a successful write, reload all data to ensure consistency
      await loadAllData();
    } catch (error) {
      console.error("Batch update failed: ", error);
      toast({ title: 'Error', description: 'Failed to update user data.', variant: 'destructive' });
    }
  }, [firestore, toast, loadAllData]);

  const switchUser = useCallback((userId: string, force = false) => {
    if (!allUsers || (user?.id === userId && !force)) return;
    const userToSwitch = allUsers.find(u => u.id === userId);
    if (userToSwitch) {
      setUser(userToSwitch);
      if (!force) {
        localStorage.setItem(FANTASY_LEAGUE_ACTIVE_USER_ID, userId);
      }
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
    
    await updateUserState([updatedUser]);
    toast({ title: 'Purchase Successful!', description: `${player.name} has been added to your bench.` });
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

    await updateUserState([updatedUser]);
    toast({ title: 'Purchase Successful!', description: `${player.name} has been added to your bench.` });
  }, [user, allUsers, toast, updateUserState]);

  const assignPlayer = useCallback(async (player: Player, targetUser: User, currentOwner?: User) => {
    if (targetUser.players.length >= 10) {
        toast({ title: "Target Roster Full", description: `${targetUser.name}'s roster is full.`, variant: "destructive"});
        return;
    }

    const usersToUpdate: User[] = [];
    const newUserPlayer: UserPlayer = { id: player.id, purchasedAt: Date.now() };

    const updatedTargetUser = {
        ...targetUser,
        players: [...targetUser.players, newUserPlayer],
        roster: { ...targetUser.roster, bench: [...targetUser.roster.bench, player.id] }
    };
    usersToUpdate.push(updatedTargetUser);

    if (currentOwner) {
        const updatedOwnerUser = {
            ...currentOwner,
            players: currentOwner.players.filter(p => p.id !== player.id),
            roster: {
                lineup: currentOwner.roster.lineup.filter(id => id !== player.id),
                bench: currentOwner.roster.bench.filter(id => id !== player.id),
            }
        };
        usersToUpdate.push(updatedOwnerUser);
    }
    
    await updateUserState(usersToUpdate);
    toast({ title: "Player Assigned!", description: `${player.name} has been given to ${targetUser.name}.`});
  }, [toast, updateUserState]);

  const sellPlayer = useCallback(async (player: Player) => {
    if (!user) return;
    const sellPrice = Math.round(player.cost * 0.5);
    const updatedUser: User = {
        ...user,
        currency: user.currency + sellPrice,
        players: user.players.filter(p => p.id !== player.id),
        roster: {
            lineup: user.roster.lineup.filter(id => id !== player.id),
            bench: user.roster.bench.filter(id => id !== player.id),
        }
    };
    await updateUserState([updatedUser]);
    toast({ title: 'Player Sold!', description: `You sold ${player.name} for ${sellPrice.toLocaleString()} coins.` });
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

    const usersToUpdate: User[] = [];
    const newUserPlayer: UserPlayer = { id: player.id, purchasedAt: Date.now() };
    const newOwnerUser = {
        ...user,
        currency: user.currency - buyoutPrice,
        players: [...user.players, newUserPlayer],
        roster: { ...user.roster, bench: [...user.roster.bench, player.id] }
    };
    usersToUpdate.push(newOwnerUser);

    const previousOwnerUser = {
        ...owner,
        currency: owner.currency + player.cost,
        players: owner.players.filter(p => p.id !== player.id),
        roster: {
            lineup: owner.roster.lineup.filter(id => id !== player.id),
            bench: owner.roster.bench.filter(id => id !== player.id),
        }
    };
    usersToUpdate.push(previousOwnerUser);
    
    await updateUserState(usersToUpdate);
    toast({ title: 'Buyout Successful!', description: `You purchased ${player.name} from ${owner.name}!` });
  }, [user, allUsers, toast, updateUserState]);

  const updateRoster = useCallback(async (lineup: string[], bench: string[]) => {
    if (!user) return;
    const updatedUser: User = { ...user, roster: { lineup, bench } };
    await updateUserState([updatedUser]);
    toast({ title: 'Roster Updated' });
  }, [user, toast, updateUserState]);

  const updateWeeklyScores = useCallback(async (playerId: string, weekId: string, scores: WeeklyScore) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      weeklyScores: {
        ...user.weeklyScores,
        [playerId]: { ...user.weeklyScores?.[playerId], [weekId]: scores }
      },
    };
    await updateUserState([updatedUser]);
    toast({ title: 'Scores Updated', description: `Scores for player ${playerId} for week ${weekId} saved.` });
  }, [user, toast, updateUserState]);

  return (
    <UserContext.Provider value={{ user, allUsers, allPlayers: ALL_PLAYERS, purchasePlayer, purchasePlayerByPeakMmr, sellPlayer, updateRoster, updateWeeklyScores, switchUser, buyoutPlayer, getPlayerById, loadAllData, assignPlayer }}>
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
