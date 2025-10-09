// This is a script to seed the initial data to Firestore.
// You can run this from your terminal:
// npx ts-node src/lib/seed.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../firebase/config';
import { USERS } from '../data/users';
import { ALL_PLAYERS } from '../data/players';
import type { User } from './types';

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

async function seedDatabase() {
  console.log('Seeding database...');

  // Seed Players
  const playersCollection = collection(db, 'players');
  const existingPlayers = await getDocs(playersCollection);
  if (existingPlayers.empty) {
    console.log('Seeding players...');
    const playerBatch = writeBatch(db);
    ALL_PLAYERS.forEach(player => {
      const playerDocRef = doc(playersCollection, player.id);
      playerBatch.set(playerDocRef, player);
    });
    await playerBatch.commit();
    console.log(`${ALL_PLAYERS.length} players seeded.`);
  } else {
    console.log('Players collection already contains data, skipping seeding.');
  }

  // Seed Users
  const usersCollection = collection(db, 'users');
  const existingUsers = await getDocs(usersCollection);
  if (existingUsers.empty) {
    console.log('Seeding users...');
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
    console.log(`${USERS.length} users seeded.`);
  } else {
    console.log('Users collection already contains data, skipping seeding.');
  }

  console.log('Database seeding complete.');
  // The script will hang if we don't exit explicitly.
  process.exit(0);
}

seedDatabase().catch(error => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
