'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { User, Player, WeeklyScore } from '@/lib/types';
import { ALL_PLAYERS } from '@/data/players';
import { useToast } from '@/hooks/use-toast';
import { USERS } from '@/data/users';

const FANTASY_LEAGUE_USERS = 'fantasy_league_users';
const FANTASY_LEAGUE_ACTIVE_USER_ID = 'fantasy_league_active_user_id';

interface UserContextType {
  user: User | null;
  allUsers: User[];
  purchasePlayer: (player: Player) => void;
  updateRoster: (lineup: Player[], bench: Player[]) => void;
  updateWeeklyScores: (playerId: string, scores: WeeklyScore) => void;
  switchUser: (userId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const hydrateUser = (user: User) => {
  if (!user) return null;
  const hydratedPlayers = user.players
    .map(p => typeof p === 'string' ? ALL_PLAYERS.find(ap => ap.id === p) : p)
    .filter((p): p is Player => !!p);
  const hydratedLineup = user.roster.lineup
    .map(p => typeof p === 'string' ? ALL_PLAYERS.find(ap => ap.id === p) : p)
    .filter((p): p is Player => !!p);
  const hydratedBench = user.roster.bench
    .map(p => typeof p === 'string' ? ALL_PLAYERS.find(ap => ap.id === p) : p)
    .filter((p): p is Player => !!p);
  return {
    ...user,
    players: hydratedPlayers,
    roster: {
      lineup: hydratedLineup,
      bench: hydratedBench
    }
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load users from localStorage or initialize with static data
    const storedUsers = localStorage.getItem(FANTASY_LEAGUE_USERS);
    let usersToLoad: User[];
    if (storedUsers) {
      usersToLoad = JSON.parse(storedUsers);
    } else {
      usersToLoad = USERS;
      localStorage.setItem(FANTASY_LEAGUE_USERS, JSON.stringify(USERS));
    }
    
    const hydratedUsers = usersToLoad.map(u => hydrateUser(u)).filter(u => u !== null) as User[];
    setAllUsers(hydratedUsers);

    // Set active user
    const activeUserId = localStorage.getItem(FANTASY_LEAGUE_ACTIVE_USER_ID);
    const activeUser = hydratedUsers.find(u => u.id === activeUserId) || hydratedUsers[0];
    if (activeUser) {
      setUser(activeUser);
      if (!activeUserId) {
        localStorage.setItem(FANTASY_LEAGUE_ACTIVE_USER_ID, activeUser.id);
      }
    }
  }, []);

  const updateUserStateAndStorage = useCallback((updatedUser: User) => {
    const hydratedUser = hydrateUser(updatedUser);
    if (!hydratedUser) return;
    
    setUser(hydratedUser);
    
    const newAllUsers = allUsers.map(u => u.id === hydratedUser.id ? hydratedUser : u);
    setAllUsers(newAllUsers);

    localStorage.setItem(FANTASY_LEAGUE_USERS, JSON.stringify(newAllUsers.map(u => ({
        ...u,
        players: u.players.map(p => p.id),
        roster: {
            lineup: u.roster.lineup.map(p => p.id),
            bench: u.roster.bench.map(p => p.id),
        }
    }))));
  }, [allUsers]);

  const switchUser = useCallback((userId: string) => {
    const userToSwitch = allUsers.find(u => u.id === userId);
    if (userToSwitch) {
      setUser(userToSwitch);
      localStorage.setItem(FANTASY_LEAGUE_ACTIVE_USER_ID, userId);
    }
  }, [allUsers]);

  const purchasePlayer = useCallback((player: Player) => {
    if (!user) return;
    if (user.players.some(p => p.id === player.id)) {
      toast({ title: 'Already Owned', description: 'You already own this player.', variant: 'destructive' });
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

    const newCurrency = user.currency - player.cost;
    const newPlayers = [...user.players, player];
    const newBench = [...user.roster.bench, player];
    toast({ title: 'Purchase Successful!', description: `${player.name} has been added to your bench.` });
    
    updateUserStateAndStorage({
      ...user,
      currency: newCurrency,
      players: newPlayers,
      roster: { ...user.roster, bench: newBench },
    });
  }, [user, toast, updateUserStateAndStorage]);

  const updateRoster = useCallback((lineup: Player[], bench: Player[]) => {
    if (!user) return;
    toast({ title: 'Roster Updated', description: 'Your lineup and bench have been saved.' });
    updateUserStateAndStorage({
      ...user,
      roster: { lineup, bench },
    });
  }, [user, toast, updateUserStateAndStorage]);

  const updateWeeklyScores = useCallback((playerId: string, scores: WeeklyScore) => {
    if (!user) return;
    const newScores = {
      ...user.weeklyScores,
      [playerId]: scores,
    };
    toast({ title: 'Scores Updated', description: `Scores for player ID ${playerId} have been saved.` });
    updateUserStateAndStorage({
      ...user,
      weeklyScores: newScores,
    });
  }, [user, toast, updateUserStateAndStorage]);

  return (
    <UserContext.Provider value={{ user, allUsers, purchasePlayer, updateRoster, updateWeeklyScores, switchUser }}>
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
