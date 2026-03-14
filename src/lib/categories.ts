/**
 * Valid word categories — single source of truth
 */
export const VALID_CATEGORIES = [
  'Animal',
  'Nourriture',
  'Métier',
  'Sport',
  'Géographie',
  'Nature',
  'Science',
  'Musique',
  'Véhicule',
  'Vêtement',
  'Corps humain',
  'Art',
  'Histoire',
  'Maison',
  'Technologie',
] as const;

export type WordCategory = (typeof VALID_CATEGORIES)[number];
