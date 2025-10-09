import type { User } from '@/lib/types';
import { ALL_PLAYERS } from './players';

const playersById = Object.fromEntries(ALL_PLAYERS.map(p => [p.id, p]));

export const USERS: User[] = [
  {
    id: 'user1',
    name: 'Player One',
    currency: 50000,
    players: [playersById['mario'], playersById['luigi'], playersById['peach'], playersById['yoshi'], playersById['bowser'], playersById['dk']],
    roster: {
      lineup: [playersById['mario'], playersById['luigi'], playersById['peach'], playersById['yoshi'], playersById['bowser'], playersById['dk']],
      bench: [],
    },
    weeklyScores: {
      mario: { race1: 150, race2: 130 },
      luigi: { race1: 140, race2: 120 },
      peach: { race1: 160, race2: 155 },
      yoshi: { race1: 170, race2: 160 },
      bowser: { race1: 110, race2: 115 },
      dk: { race1: 100, race2: 125 },
    },
  },
  {
    id: 'user2',
    name: 'Speed Demon',
    currency: 30000,
    players: [playersById['toad'], playersById['koopa'], playersById['daisy'], playersById['wario'], playersById['waluigi'], playersById['rosalina']],
    roster: {
      lineup: [playersById['toad'], playersById['koopa'], playersById['daisy'], playersById['wario'], playersById['waluigi'], playersById['rosalina']],
      bench: [],
    },
    weeklyScores: {
      toad: { race1: 180, race2: 170 },
      koopa: { race1: 175, race2: 165 },
      daisy: { race1: 150, race2: 145 },
      wario: { race1: 100, race2: 90 },
      waluigi: { race1: 120, race2: 130 },
      rosalina: { race1: 135, race2: 140 },
    },
  },
  {
    id: 'user3',
    name: 'Newbie Racer',
    currency: 60000,
    players: [playersById['shyguy'], playersById['lakitu'], playersById['kingboo']],
    roster: {
      lineup: [playersById['shyguy'], playersById['lakitu'], playersById['kingboo']],
      bench: [],
    },
    weeklyScores: {
      shyguy: { race1: 120, race2: 110 },
      lakitu: { race1: 130, race2: 140 },
      kingboo: { race1: 115, race2: 105 },
    },
  },
];
