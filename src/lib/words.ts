/**
 * French word list for Hangman game
 * Words are categorized for optional hints
 */

export interface WordEntry {
  word: string;
  category: string;
}

export const WORDS: WordEntry[] = [
  // Animaux
  { word: 'chat', category: 'Animal' },
  { word: 'chien', category: 'Animal' },
  { word: 'éléphant', category: 'Animal' },
  { word: 'girafe', category: 'Animal' },
  { word: 'hippopotame', category: 'Animal' },
  { word: 'kangourou', category: 'Animal' },
  { word: 'papillon', category: 'Animal' },
  { word: 'crocodile', category: 'Animal' },
  { word: 'dauphin', category: 'Animal' },
  { word: 'pingouin', category: 'Animal' },
  { word: 'grenouille', category: 'Animal' },
  { word: 'écureuil', category: 'Animal' },
  { word: 'hérisson', category: 'Animal' },
  { word: 'tortue', category: 'Animal' },
  { word: 'lapin', category: 'Animal' },

  // Fruits
  { word: 'pomme', category: 'Fruit' },
  { word: 'banane', category: 'Fruit' },
  { word: 'fraise', category: 'Fruit' },
  { word: 'orange', category: 'Fruit' },
  { word: 'cerise', category: 'Fruit' },
  { word: 'ananas', category: 'Fruit' },
  { word: 'pastèque', category: 'Fruit' },
  { word: 'mangue', category: 'Fruit' },
  { word: 'pêche', category: 'Fruit' },
  { word: 'raisin', category: 'Fruit' },
  { word: 'citron', category: 'Fruit' },
  { word: 'poire', category: 'Fruit' },
  { word: 'abricot', category: 'Fruit' },
  { word: 'framboise', category: 'Fruit' },
  { word: 'kiwi', category: 'Fruit' },

  // Métiers
  { word: 'médecin', category: 'Métier' },
  { word: 'boulanger', category: 'Métier' },
  { word: 'pompier', category: 'Métier' },
  { word: 'professeur', category: 'Métier' },
  { word: 'astronaute', category: 'Métier' },
  { word: 'cuisinier', category: 'Métier' },
  { word: 'musicien', category: 'Métier' },
  { word: 'architecte', category: 'Métier' },
  { word: 'photographe', category: 'Métier' },
  { word: 'vétérinaire', category: 'Métier' },
  { word: 'dentiste', category: 'Métier' },
  { word: 'journaliste', category: 'Métier' },
  { word: 'avocat', category: 'Métier' },
  { word: 'pilote', category: 'Métier' },
  { word: 'jardinier', category: 'Métier' },

  // Objets
  { word: 'ordinateur', category: 'Objet' },
  { word: 'télévision', category: 'Objet' },
  { word: 'téléphone', category: 'Objet' },
  { word: 'parapluie', category: 'Objet' },
  { word: 'bicyclette', category: 'Objet' },
  { word: 'trampoline', category: 'Objet' },
  { word: 'microscope', category: 'Objet' },
  { word: 'dictionnaire', category: 'Objet' },
  { word: 'réveil', category: 'Objet' },
  { word: 'lunettes', category: 'Objet' },
  { word: 'ciseaux', category: 'Objet' },
  { word: 'clavier', category: 'Objet' },
  { word: 'casserole', category: 'Objet' },
  { word: 'valise', category: 'Objet' },
  { word: 'bouteille', category: 'Objet' },

  // Nature
  { word: 'montagne', category: 'Nature' },
  { word: 'cascade', category: 'Nature' },
  { word: 'volcan', category: 'Nature' },
  { word: 'arc-en-ciel', category: 'Nature' },
  { word: 'tournesol', category: 'Nature' },
  { word: 'forêt', category: 'Nature' },
  { word: 'rivière', category: 'Nature' },
  { word: 'étoile', category: 'Nature' },
  { word: 'nuage', category: 'Nature' },
  { word: 'tonnerre', category: 'Nature' },
  { word: 'glacier', category: 'Nature' },
  { word: 'désert', category: 'Nature' },
  { word: 'prairie', category: 'Nature' },
  { word: 'aurore', category: 'Nature' },
  { word: 'océan', category: 'Nature' },

  // Sports
  { word: 'football', category: 'Sport' },
  { word: 'basketball', category: 'Sport' },
  { word: 'natation', category: 'Sport' },
  { word: 'gymnastique', category: 'Sport' },
  { word: 'escalade', category: 'Sport' },
  { word: 'équitation', category: 'Sport' },
  { word: 'badminton', category: 'Sport' },
  { word: 'volleyball', category: 'Sport' },
  { word: 'cyclisme', category: 'Sport' },
  { word: 'athlétisme', category: 'Sport' },
  { word: 'escrime', category: 'Sport' },
  { word: 'aviron', category: 'Sport' },
  { word: 'plongée', category: 'Sport' },
  { word: 'patinage', category: 'Sport' },
  { word: 'boxe', category: 'Sport' },

  // Nourriture
  { word: 'croissant', category: 'Nourriture' },
  { word: 'baguette', category: 'Nourriture' },
  { word: 'chocolat', category: 'Nourriture' },
  { word: 'spaghetti', category: 'Nourriture' },
  { word: 'hamburger', category: 'Nourriture' },
  { word: 'omelette', category: 'Nourriture' },
  { word: 'sandwich', category: 'Nourriture' },
  { word: 'quiche', category: 'Nourriture' },
  { word: 'raclette', category: 'Nourriture' },
  { word: 'brioche', category: 'Nourriture' },
  { word: 'crêpe', category: 'Nourriture' },
  { word: 'gaufre', category: 'Nourriture' },
  { word: 'soupe', category: 'Nourriture' },
  { word: 'salade', category: 'Nourriture' },
  { word: 'fromage', category: 'Nourriture' },

  // Pays / Villes
  { word: 'France', category: 'Géographie' },
  { word: 'Japon', category: 'Géographie' },
  { word: 'Australie', category: 'Géographie' },
  { word: 'Brésil', category: 'Géographie' },
  { word: 'Canada', category: 'Géographie' },
  { word: 'Égypte', category: 'Géographie' },
  { word: 'Islande', category: 'Géographie' },
  { word: 'Mexique', category: 'Géographie' },
  { word: 'Norvège', category: 'Géographie' },
  { word: 'Portugal', category: 'Géographie' },
  { word: 'Paris', category: 'Géographie' },
  { word: 'Londres', category: 'Géographie' },
  { word: 'Tokyo', category: 'Géographie' },
  { word: 'Marseille', category: 'Géographie' },
  { word: 'Berlin', category: 'Géographie' },
];

/**
 * Get a random word from the list
 */
export function getRandomWord(): WordEntry {
  const index = Math.floor(Math.random() * WORDS.length);
  const entry = WORDS[index];
  if (!entry) {
    throw new Error('Word list is empty');
  }
  return entry;
}

/**
 * Get a random word from a specific category
 */
export function getRandomWordByCategory(category: string): WordEntry | null {
  const filtered = WORDS.filter((w) => w.category === category);
  if (filtered.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * filtered.length);
  return filtered[index] ?? null;
}

/**
 * Get all available categories
 */
export function getCategories(): string[] {
  return [...new Set(WORDS.map((w) => w.category))];
}
