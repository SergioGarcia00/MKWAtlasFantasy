import type { Player } from '@/lib/types';

export const ALL_PLAYERS: Player[] = [
  { id: 'mario', name: 'Mario', icon: 'Mario', cost: 2300, stats: { speed: 7, acceleration: 6, weight: 6, handling: 5, traction: 6 } },
  { id: 'luigi', name: 'Luigi', icon: 'Luigi', cost: 2200, stats: { speed: 6, acceleration: 7, weight: 5, handling: 6, traction: 5 } },
  { id: 'peach', name: 'Peach', icon: 'Peach', cost: 2100, stats: { speed: 5, acceleration: 8, weight: 4, handling: 7, traction: 4 } },
  { id: 'yoshi', name: 'Yoshi', icon: 'Yoshi', cost: 2400, stats: { speed: 6, acceleration: 7, weight: 4, handling: 8, traction: 6 } },
  { id: 'bowser', name: 'Bowser', icon: 'Bowser', cost: 2800, stats: { speed: 9, acceleration: 3, weight: 10, handling: 2, traction: 8 } },
  { id: 'dk', name: 'Donkey Kong', icon: 'DK', cost: 2600, stats: { speed: 8, acceleration: 4, weight: 9, handling: 3, traction: 7 } },
  { id: 'toad', name: 'Toad', icon: 'Toad', cost: 2000, stats: { speed: 3, acceleration: 10, weight: 2, handling: 9, traction: 3 } },
  { id: 'koopa', name: 'Koopa Troopa', icon: 'Koopa', cost: 1900, stats: { speed: 4, acceleration: 9, weight: 3, handling: 8, traction: 4 } },
  { id: 'daisy', name: 'Daisy', cost: 2150, icon: 'Peach', stats: { speed: 5, acceleration: 8, weight: 4, handling: 8, traction: 4 } },
  { id: 'wario', name: 'Wario', cost: 2750, icon: 'Bowser', stats: { speed: 9, acceleration: 3, weight: 9, handling: 3, traction: 7 } },
  { id: 'waluigi', name: 'Waluigi', cost: 2550, icon: 'Luigi', stats: { speed: 7, acceleration: 5, weight: 7, handling: 5, traction: 6 } },
  { id: 'rosalina', name: 'Rosalina', cost: 2450, icon: 'Peach', stats: { speed: 6, acceleration: 6, weight: 6, handling: 6, traction: 6 } },
  { id: 'kingboo', name: 'King Boo', cost: 2700, icon: 'Bowser', stats: { speed: 8, acceleration: 4, weight: 8, handling: 4, traction: 7 } },
  { id: 'shyguy', name: 'Shy Guy', cost: 2250, icon: 'Toad', stats: { speed: 6, acceleration: 7, weight: 5, handling: 7, traction: 5 } },
  { id: 'lakitu', name: 'Lakitu', cost: 2050, icon: 'Koopa', stats: { speed: 4, acceleration: 9, weight: 3, handling: 9, traction: 3 } },
];
