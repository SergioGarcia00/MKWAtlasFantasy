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

const safeJsonParse = (json: string) => {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

const sanitizeUser = (user: User) => {
  const sanitized = JSON.parse(JSON.stringify(user));
  sanitized.players = sanitized.players.filter(Boolean);
  if (sanitized.roster.lineup) {
    sanitized.roster.lineup = sanitized.roster.lineup.filter(Boolean);
  }
  if (sanitized.roster.bench) {
    sanitized.roster.bench = sanitized.roster.bench.filter(Boolean);
  }
  return sanitized;
}


export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedUserId = localStorage.getItem('currentUserId');
    const initialUser = storedUserId
      ? USERS.find(u => u.id === storedUserId)
      : USERS[0];
      
    if (initialUser) {
      setUser(sanitizeUser(initialUser));
    }
  }, []);

  const switchUser = useCallback((userId: string) => {
    const newUser = USERS.find(u => u.id === userId);
    if (newUser) {
      setUser(sanitizeUser(newUser));
      localStorage.setItem('currentUserId', userId);
      window.location.href = '/'; // Force a reload to ensure all components re-render with new user context
    }
  }, []);

  const purchasePlayer = useCallback((player: Player) => {
    setUser(currentUser => {
      if (!currentUser || !player) return currentUser;
      if (currentUser.players.some(p => p && p.id === player.id)) {
        toast({ title: 'Already Owned', description: 'You already own this player.', variant: 'destructive' });
        return currentUser;
      }
      if (currentUser.players.length >= 10) {
        toast({ title: 'Roster Full', description: 'You cannot purchase more than 10 players.', variant: 'destructive' });
        return currentUser;
      }
      if (currentUser.currency < player.cost) {
        toast({ title: 'Insufficient Funds', description: 'You do not have enough coins to purchase this player.', variant: 'destructive' });
        return currentUser;
      }

      const newCurrency = currentUser.currency - player.cost;
      const newPlayers = [...currentUser.players, player];
      const newBench = [...currentUser.roster.bench, player];

      toast({ title: 'Purchase Successful!', description: `${player.name} has been added to your bench.` });

      return {
        ...currentUser,
        currency: newCurrency,
        players: newPlayers,
        roster: { ...currentUser.roster, bench: newBench },
      };
    });
  }, [toast]);

  const updateRoster = useCallback((lineup: Player[], bench: Player[]) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      toast({ title: 'Roster Updated', description: 'Your lineup and bench have been saved.' });
      return {
        ...currentUser,
        roster: { lineup, bench },
      };
    });
  }, [toast]);

  const updateWeeklyScores = useCallback((playerId: string, scores: WeeklyScore) => {
    setUser(currentUser => {
      if (!currentUser) return null;

      const newScores = {
        ...currentUser.weeklyScores,
        [playerId]: scores,
      };

      toast({ title: 'Scores Updated', description: `Scores for player ID ${playerId} have been saved.` });
      return {
        ...currentUser,
        weeklyScores: newScores,
      };
    });
  }, [toast]);

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
