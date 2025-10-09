'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, Player, WeeklyScore } from '@/lib/types';
import { USERS } from '@/data/users';
import { useToast } from '@/hooks/use-toast';

interface UserContextType {
  user: User | null;
  purchasePlayer: (player: Player) => void;
  updateRoster: (lineup: Player[], bench: Player[]) => void;
  updateWeeklyScores: (playerId: string, scores: WeeklyScore) => void;
  switchUser: (userId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const AllUsersState: Record<string, User> = {};
USERS.forEach(user => {
  AllUsersState[user.id] = user;
});

const sanitizeUser = (user: User) => {
  if (!user) return null;
  const sanitized = JSON.parse(JSON.stringify(user));
  if (sanitized.players) {
    sanitized.players = sanitized.players.filter(Boolean);
  }
  if (sanitized.roster && sanitized.roster.lineup) {
    sanitized.roster.lineup = sanitized.roster.lineup.filter(Boolean);
  }
  if (sanitized.roster && sanitized.roster.bench) {
    sanitized.roster.bench = sanitized.roster.bench.filter(Boolean);
  }
  return sanitized;
}

const getInitialState = () => {
    if (typeof window === 'undefined') {
        return USERS[0];
    }
    const storedUsers = localStorage.getItem('allUsersData');
    const storedUserId = localStorage.getItem('currentUserId');
    
    if (storedUsers) {
        const allUsers = JSON.parse(storedUsers);
        const userId = storedUserId || USERS[0].id;
        return allUsers[userId] || USERS[0];
    }
    
    localStorage.setItem('allUsersData', JSON.stringify(AllUsersState));
    const userId = storedUserId || USERS[0].id;
    return USERS.find(u => u.id === userId) || USERS[0];
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initialUser = getInitialState();
    setUser(sanitizeUser(initialUser));
  }, []);

  const updateUserStateAndStorage = (updatedUser: User) => {
      setUser(updatedUser);
      const allUsersData = JSON.parse(localStorage.getItem('allUsersData') || '{}');
      allUsersData[updatedUser.id] = updatedUser;
      localStorage.setItem('allUsersData', JSON.stringify(allUsersData));
  }

  const switchUser = useCallback((userId: string) => {
    const allUsers = JSON.parse(localStorage.getItem('allUsersData') || '{}');
    const newUser = allUsers[userId];
    
    if (newUser) {
      setUser(sanitizeUser(newUser));
      localStorage.setItem('currentUserId', userId);
      window.location.reload(); 
    }
  }, []);

  const purchasePlayer = useCallback((player: Player) => {
    if (!user || !player) return;

    if (user.players.some(p => p && p.id === player.id)) {
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

    const updatedUser = {
      ...user,
      currency: newCurrency,
      players: newPlayers,
      roster: { ...user.roster, bench: newBench },
    };
    updateUserStateAndStorage(updatedUser);
  }, [user, toast]);

  const updateRoster = useCallback((lineup: Player[], bench: Player[]) => {
    if (!user) return;
    toast({ title: 'Roster Updated', description: 'Your lineup and bench have been saved.' });
    const updatedUser = {
      ...user,
      roster: { lineup, bench },
    };
    updateUserStateAndStorage(updatedUser);
  }, [user, toast]);

  const updateWeeklyScores = useCallback((playerId: string, scores: WeeklyScore) => {
    if (!user) return;

    const newScores = {
      ...user.weeklyScores,
      [playerId]: scores,
    };

    toast({ title: 'Scores Updated', description: `Scores for player ID ${playerId} have been saved.` });
    const updatedUser = {
      ...user,
      weeklyScores: newScores,
    };
    updateUserStateAndStorage(updatedUser);
  }, [user, toast]);

  return (
    <UserContext.Provider value={{ user, purchasePlayer, updateRoster, updateWeeklyScores, switchUser }}>
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
