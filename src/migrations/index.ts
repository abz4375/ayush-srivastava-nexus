import * as migration_20250725_075737_change_projects_id_to_integer from './20250725_075737_change_projects_id_to_integer';
import * as migration_20250725_075836_change_skills_id_to_integer from './20250725_075836_change_skills_id_to_integer';

export const migrations = [
  {
    up: migration_20250725_075737_change_projects_id_to_integer.up,
    down: migration_20250725_075737_change_projects_id_to_integer.down,
    name: '20250725_075737_change_projects_id_to_integer',
  },
  {
    up: migration_20250725_075836_change_skills_id_to_integer.up,
    down: migration_20250725_075836_change_skills_id_to_integer.down,
    name: '20250725_075836_change_skills_id_to_integer'
  },
];
