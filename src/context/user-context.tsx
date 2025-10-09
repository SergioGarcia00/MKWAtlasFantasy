'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth, useFirestore, useUser as useFirebaseUser } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import type { User, Player, WeeklyScore } from '@/lib/types';
import { USERS } from '@/data/users'; // We'll still use this for initial seeding
import { ALL_PLAYERS } from '@/data/players';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface UserContextType {
  user: User | null;
  purchasePlayer: (player: Player) => void;
  updateRoster: (lineup: Player[], bench: Player[]) => void;
  updateWeeklyScores: (playerId: string, scores: WeeklyScore) => void;
  switchUser: (userId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { user: firebaseUser, isUserLoading } = useFirebaseUser();
  const firestore = useFirestore();
  const auth = useAuth();
  
  // This effect handles the initial sign-in and data fetching
  useEffect(() => {
    const handleUser = async () => {
      if (!isUserLoading && !firebaseUser) {
        // Not logged in, so sign in anonymously
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Anonymous sign-in failed", error);
        }
      } else if (firebaseUser) {
        // User is logged in, now fetch their data
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as User;
          const hydratedPlayers = userData.players?.map(pId => ALL_PLAYERS.find(p => p.id === (pId as unknown as string)))
                                      .filter((p): p is Player => !!p) || [];
          const hydratedLineup = userData.roster?.lineup.map(pId => ALL_PLAYERS.find(p => p.id === (pId as unknown as string)))
                                     .filter((p): p is Player => !!p) || [];
          const hydratedBench = userData.roster?.bench.map(pId => ALL_PLAYERS.find(p => p.id === (pId as unknown as string)))
                                    .filter((p): p is Player => !!p) || [];
          setUser({
            ...userData,
            id: userDocSnap.id,
            players: hydratedPlayers,
            roster: {
              lineup: hydratedLineup,
              bench: hydratedBench
            }
          });
        } else {
          // New user, create their document from the default template
          const defaultUser = USERS[0];
          const newUser: User = {
            ...defaultUser,
            id: firebaseUser.uid,
            name: 'New Player',
             players: [],
             roster: {
                 lineup: [],
                 bench: [],
             },
             weeklyScores: {},
             currency: 50000,
          };
          // We only store IDs in firestore
          const firestoreUser = {
              ...newUser,
              players: [],
              roster: {
                lineup: [],
                bench: []
              }
          }
          await setDoc(userDocRef, firestoreUser);
          setUser(newUser);
        }
      }
    };

    handleUser();
  }, [firebaseUser, isUserLoading, firestore, auth]);


  const updateUserStateAndFirestore = (updatedUser: User) => {
    if (!firebaseUser) return;
    setUser(updatedUser);
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);

    // Create a version of the user object with player IDs instead of full objects
    const firestoreUser = {
        ...updatedUser,
        players: updatedUser.players.map(p => p.id),
        roster: {
            lineup: updatedUser.roster.lineup.map(p => p.id),
            bench: updatedUser.roster.bench.map(p => p.id),
        }
    };
    
    // Use the non-blocking update
    setDocumentNonBlocking(userDocRef, firestoreUser, { merge: true });
  }

  const switchUser = useCallback((userId: string) => {
    // This functionality will change with real auth.
    // For now, we can't really "switch" Firebase users easily.
    // This will require a re-login flow in a real app.
    // Let's just toast a message for now.
    toast({
        title: 'User Switching',
        description: 'In a real app, this would log you out and back in as another user.'
    });
  }, [toast]);

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
    updateUserStateAndFirestore(updatedUser);
  }, [user, toast]);

  const updateRoster = useCallback((lineup: Player[], bench: Player[]) => {
    if (!user) return;
    toast({ title: 'Roster Updated', description: 'Your lineup and bench have been saved.' });
    const updatedUser = {
      ...user,
      roster: { lineup, bench },
    };
    updateUserStateAndFirestore(updatedUser);
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
    updateUserStateAndFirestore(updatedUser);
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
