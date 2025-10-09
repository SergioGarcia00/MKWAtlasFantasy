'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, Player, WeeklyScore } from '@/lib/types';
import { USERS } from '@/data/users';
import { ALL_PLAYERS } from '@/data/players';
import { useToast } from '@/hooks/use-toast';

interface UserContextType {
  user: User | null;
  purchasePlayer: (player: Player) => void;
  updateRoster: (lineup: Player[], bench: Player[]) => void;
  updateWeeklyScores: (playerId: string, scores: WeeklyScore) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, you'd fetch the current user. Here we'll just use the first mock user.
    setUser(JSON.parse(JSON.stringify(USERS[0])));
  }, []);

  const purchasePlayer = useCallback((player: Player) => {
    setUser(currentUser => {
      if (!currentUser) return null;

      if (currentUser.players.length >= 10) {
        toast({ title: 'Roster Full', description: 'You cannot purchase more than 10 players.', variant: 'destructive' });
        return currentUser;
      }
      if (currentUser.currency < player.cost) {
        toast({ title: 'Insufficient Funds', description: 'You do not have enough coins to purchase this player.', variant: 'destructive' });
        return currentUser;
      }
      if (currentUser.players.some(p => p.id === player.id)) {
        toast({ title: 'Already Owned', description: 'You already own this player.', variant: 'destructive' });
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
    <UserContext.Provider value={{ user, purchasePlayer, updateRoster, updateWeeklyScores }}>
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
