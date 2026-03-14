/**
 * Common French Bigrams
 *
 * Top ~35 most frequent letter pairs in French text.
 * Used to evaluate how "guessable" a word is.
 */

export const COMMON_BIGRAMS_FR: ReadonlySet<string> = new Set([
  'ES',
  'EN',
  'OU',
  'DE',
  'AN',
  'RE',
  'ER',
  'LE',
  'ON',
  'NT',
  'AI',
  'TE',
  'ET',
  'EL',
  'SE',
  'IT',
  'LA',
  'IS',
  'AL',
  'ME',
  'IN',
  'NE',
  'OR',
  'UR',
  'RA',
  'AR',
  'CO',
  'RI',
  'IO',
  'AT',
  'IE',
  'IR',
  'CE',
  'IL',
  'CH',
]);

export function isBigramCommon(bigram: string): boolean {
  return COMMON_BIGRAMS_FR.has(bigram.toUpperCase());
}
