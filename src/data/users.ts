'use client';

import type { User } from '@/lib/types';
import { ALL_PLAYERS } from './players';

const getPlayer = (name: string) => ALL_PLAYERS.find(p => p.name === name);

const players = {
  vincent: getPlayer('? Vincent ! Jeef'),
  ruhestand: getPlayer('Ruhestand'),
  coinBlockBuster: getPlayer('CoinBlockBuster'),
  bagz: getPlayer('Bagz'),
  froz: getPlayer('Froz_11'),
  octo: getPlayer('Octo'),
  zadi: getPlayer('ZaDi'),
  samuel: getPlayer('Samuel Badcock'),
  buneary: getPlayer('buneary'),
  luma: getPlayer('Luma'),
  haliey: getPlayer('Haliey Welch'),
  flora: getPlayer('flora'),
  kingVon: getPlayer('King Von'),
  feathers: getPlayer('Feathers McGraw'),
  reaper: getPlayer('Utah Grim Reaper'),
  steez: getPlayer('Steez'),
  tylerrr: getPlayer('Tylerrr'),
  arti: getPlayer('Arti'),
  rey: getPlayer('rey'),
  tomsu: getPlayer('Tomsu'),
  ty: getPlayer('Ty'),
  bery: getPlayer('Bery'),
  riize: getPlayer('Riize'),
  lore: getPlayer('Lore'),
  twingy: getPlayer('Twingy'),
  grimbsy: getPlayer('Grimsby Town'),
  seven: getPlayer('7o7'),
  jsaav: getPlayer('Jsaav'),
  bargner: getPlayer('Addison Barger'),
  najman: getPlayer('Najman'),
  aline: getPlayer('Aline Pee'),
  azrok: getPlayer('Azrok'),
  chaozu: getPlayer('Chaozu'),
  nvm: getPlayer('nvm'),
  incineroar: getPlayer('Incineroar'),
  mandown: getPlayer('ManDown'),
  lockin: getPlayer('Lock-in'),
  toopa: getPlayer('Toopa'),
  yuki: getPlayer('Yuki'),
  shurikn: getPlayer('1Shurikn'),
  caro: getPlayer('Caro'),
  greg: getPlayer('gregFR'),
  lecka: getPlayer('Lecka'),
  milovan: getPlayer('Milovan'),
  nissou: getPlayer('Nissou'),
  sipgb: getPlayer('Sipgb'),
  seral: getPlayer('Seral'),
  sonic: getPlayer('Sonic'),
  morioh: getPlayer('Morioh'),
  vick: getPlayer('Vick'),
  elgraco: getPlayer('elgraco'),
  yegu: getPlayer('Yegu07'),
};

const validPlayers = Object.values(players).filter(p => p !== undefined);

export const USERS: User[] = [
  {
    id: 'user-sipgb',
    name: 'Sipgb',
    currency: 50000,
    players: [players.vincent, players.ruhestand, players.coinBlockBuster, players.bagz, players.froz, players.octo].filter(Boolean) as Player[],
    roster: {
      lineup: [players.vincent, players.ruhestand, players.coinBlockBuster, players.bagz, players.froz, players.octo].filter(Boolean) as Player[],
      bench: [],
    },
    weeklyScores: {},
  },
  {
    id: 'user-seral',
    name: 'Seral',
    currency: 50000,
    players: [players.samuel, players.buneary, players.luma, players.haliey, players.flora, players.kingVon].filter(Boolean) as Player[],
    roster: {
      lineup: [players.samuel, players.buneary, players.luma, players.haliey, players.flora, players.kingVon].filter(Boolean) as Player[],
      bench: [],
    },
    weeklyScores: {},
  },
  {
    id: 'user-sonic',
    name: 'Sonic',
    currency: 50000,
    players: [players.feathers, players.reaper, players.steez, players.tylerrr, players.arti, players.rey].filter(Boolean) as Player[],
    roster: {
      lineup: [players.feathers, players.reaper, players.steez, players.tylerrr, players.arti, players.rey].filter(Boolean) as Player[],
      bench: [],
    },
    weeklyScores: {},
  },
  {
    id: 'user-morioh',
    name: 'Morioh',
    currency: 50000,
    players: [players.tomsu, players.ty, players.bery, players.riize, players.lore, players.twingy].filter(Boolean) as Player[],
    roster: {
      lineup: [players.tomsu, players.ty, players.bery, players.riize, players.lore, players.twingy].filter(Boolean) as Player[],
      bench: [],
    },
    weeklyScores: {},
  },
  {
    id: 'user-vick',
    name: 'Vick',
    currency: 50000,
    players: [players.grimbsy, players.seven, players.jsaav, players.bargner, players.najman, players.aline].filter(Boolean) as Player[],
    roster: {
      lineup: [players.grimbsy, players.seven, players.jsaav, players.bargner, players.najman, players.aline].filter(Boolean) as Player[],
      bench: [],
    },
    weeklyScores: {},
  },
  {
    id: 'user-elgraco',
    name: 'Elgraco',
    currency: 50000,
    players: [players.azrok, players.chaozu, players.nvm, players.incineroar, players.mandown, players.lockin].filter(Boolean) as Player[],
    roster: {
      lineup: [players.azrok, players.chaozu, players.nvm, players.incineroar, players.mandown, players.lockin].filter(Boolean) as Player[],
      bench: [],
    },
    weeklyScores: {},
  },
  {
    id: 'user-yegu',
    name: 'Yegu',
    currency: 50000,
    players: [players.toopa, players.yuki, players.shurikn, players.caro, players.greg, players.lecka].filter(Boolean) as Player[],
    roster: {
      lineup: [players.toopa, players.yuki, players.shurikn, players.caro, players.greg, players.lecka].filter(Boolean) as Player[],
      bench: [],
    },
    weeklyScores: {},
  },
].map(user => {
  const validPlayersForUser = user.players.filter(Boolean);
  const validLineup = user.roster.lineup.filter(Boolean);
  const validBench = user.roster.bench.filter(Boolean);

  const weeklyScores: User['weeklyScores'] = {};
  validLineup.forEach(p => {
    if (p && p.id) { // Check if p and p.id are not null/undefined
      weeklyScores[p.id] = { race1: Math.floor(Math.random() * 100) + 50, race2: Math.floor(Math.random() * 100) + 50 };
    }
  });

  return {
    ...user,
    players: validPlayersForUser,
    roster: {
      lineup: validLineup,
      bench: validBench,
    },
    weeklyScores,
  };
});
