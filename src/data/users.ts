'use client';

import type { User } from '@/lib/types';

// This file is now primarily for providing the initial list of user IDs.
// The full user data will be loaded from individual JSON files via API.

export const USER_IDS = [
  'user-sipgb',
  'user-seral',
  'user-sonic',
  'user-morioh',
  'user-vick',
  'user-elgraco',
  'user-yegu',
];

// The detailed user objects are now in /src/data/users/[userId].json
// This central USERS array is no longer the source of truth.
export const USERS: User[] = [];
