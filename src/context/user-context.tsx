'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth, useFirestore, useUser as useFirebaseUser } from '@/firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, Auth } from 'firebase/auth';
import type { User, Player, WeeklyScore } from '@/lib/types';
import { ALL_PLAYERS } from '@/data/players';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { USERS } from '@/data/users';

const FANTASY_LEAGUE_USER_ID = 'fantasy_league_user_id';

interface UserContextType {
  user: User | null;
  allUsers: User[];
  purchasePlayer: (player: Player) => void;
  updateRoster: (lineup: Player[], bench: Player[]) => void;
  updateWeeklyScores: (playerId: string, scores: WeeklyScore) => void;
  switchUser: (userId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

async function seedInitialUsers(auth: Auth, firestore: any) {
    const userBatch = writeBatch(db);
    USERS.forEach(user => {
      const userDocRef = doc(usersCollection, user.id);
      // Storing only player IDs
      const firestoreUser = {
        ...user,
        players: user.players.map(p => p.id),
        roster: {
          lineup: user.roster.lineup.map(p => p.id),
          bench: user.roster.bench.map(p => p.id)
        }
      }
      userBatch.set(userDocRef, firestoreUser);
    });
    await userBatch.commit();
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const { user: firebaseUser, isUserLoading } = useFirebaseUser();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem(FANTASY_LEAGUE_USER_ID);
      if (storedUserId) {
        setActiveUserId(storedUserId);
      } else {
        // Default to the first user in the static list if none is set
        const firstUserId = USERS[0]?.id;
        if(firstUserId) {
          setActiveUserId(firstUserId);
          localStorage.setItem(FANTASY_LEAGUE_USER_ID, firstUserId);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!firestore) return;

    const fetchAllUsers = async () => {
      const usersCollectionRef = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersCollectionRef);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setAllUsers(usersList);
    };

    fetchAllUsers();
  }, [firestore]);


  useEffect(() => {
    const handleUser = async () => {
      if (isUserLoading || !activeUserId || !firestore) {
        return;
      }
      
      if (!firebaseUser) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Anonymous sign-in failed", error);
        }
        return; // Wait for user to be signed in on next effect run
      }
      
      // We have a firebase user and an active user ID, fetch the data
      const userDocRef = doc(firestore, 'users', activeUserId);
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
         console.warn(`User document for ID ${activeUserId} not found. Seeding might be required.`);
         // Optional: handle case where user doc doesn't exist, maybe select another user.
      }
    };

    handleUser();
  }, [activeUserId, firebaseUser, isUserLoading, firestore, auth]);


  const updateUserStateAndFirestore = (updatedUser: User) => {
    if (!updatedUser) return;
    setUser(updatedUser);
    const userDocRef = doc(firestore, 'users', updatedUser.id);

    const firestoreUser = {
        ...updatedUser,
        players: updatedUser.players.map(p => p.id),
        roster: {
            lineup: updatedUser.roster.lineup.map(p => p.id),
            bench: updatedUser.roster.bench.map(p => p.id),
        }
    };
    
    setDocumentNonBlocking(userDocRef, firestoreUser, { merge: true });
  }

  const switchUser = useCallback((userId: string) => {
    if (userId) {
        setUser(null); // Clear current user to show loading state
        setActiveUserId(userId);
        localStorage.setItem(FANTASY_LEAGUE_USER_ID, userId);
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