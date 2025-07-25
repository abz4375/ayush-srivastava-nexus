import * as migration_20250725_103741 from './20250725_103741';

export const migrations = [
  {
    up: migration_20250725_103741.up,
    down: migration_20250725_103741.down,
    name: '20250725_103741'
  },
];
