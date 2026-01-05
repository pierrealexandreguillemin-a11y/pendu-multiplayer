import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGame,
  guessLetter,
  getDisplayWord,
  isValidLetter,
  normalizeWord,
  isGameOver,
  canGuess,
} from '@/lib/game-engine';
import type { GameState, Letter } from '@/types/game';
import { MAX_ERRORS } from '@/types/game';

describe('GameEngine', () => {
  describe('normalizeWord', () => {
    it('should_convert_to_uppercase', () => {
      expect(normalizeWord('pendu')).toBe('PENDU');
    });

    it('should_remove_accents_from_french_words', () => {
      expect(normalizeWord('café')).toBe('CAFE');
      expect(normalizeWord('éléphant')).toBe('ELEPHANT');
      expect(normalizeWord('naïf')).toBe('NAIF');
      expect(normalizeWord('Noël')).toBe('NOEL');
      expect(normalizeWord('garçon')).toBe('GARCON');
    });

    it('should_preserve_spaces_and_hyphens', () => {
      expect(normalizeWord('arc-en-ciel')).toBe('ARC-EN-CIEL');
      expect(normalizeWord('pomme de terre')).toBe('POMME DE TERRE');
    });
  });

  describe('isValidLetter', () => {
    it('should_accept_uppercase_letters', () => {
      expect(isValidLetter('A')).toBe(true);
      expect(isValidLetter('Z')).toBe(true);
      expect(isValidLetter('M')).toBe(true);
    });

    it('should_accept_lowercase_and_convert', () => {
      expect(isValidLetter('a')).toBe(true);
      expect(isValidLetter('z')).toBe(true);
    });

    it('should_reject_non_letters', () => {
      expect(isValidLetter('1')).toBe(false);
      expect(isValidLetter(' ')).toBe(false);
      expect(isValidLetter('-')).toBe(false);
      expect(isValidLetter('é')).toBe(false);
    });
  });

  describe('createGame', () => {
    it('should_create_game_with_normalized_word', () => {
      const state = createGame({ word: 'Pendu' });

      expect(state.word).toBe('PENDU');
      expect(state.originalWord).toBe('Pendu');
      expect(state.errors).toBe(0);
      expect(state.status).toBe('playing');
      expect(state.correctLetters.size).toBe(0);
      expect(state.wrongLetters.size).toBe(0);
    });

    it('should_store_category_when_provided', () => {
      const state = createGame({ word: 'chat', category: 'Animal' });

      expect(state.category).toBe('Animal');
    });

    it('should_handle_accented_words', () => {
      const state = createGame({ word: 'café' });

      expect(state.word).toBe('CAFE');
      expect(state.originalWord).toBe('café');
    });
  });

  describe('getDisplayWord', () => {
    let state: GameState;

    beforeEach(() => {
      state = createGame({ word: 'PENDU' });
    });

    it('should_show_all_underscores_at_start', () => {
      const display = getDisplayWord(state);

      expect(display).toEqual(['_', '_', '_', '_', '_']);
    });

    it('should_reveal_correct_letters', () => {
      state.correctLetters.add('E');
      const display = getDisplayWord(state);

      expect(display).toEqual(['_', 'E', '_', '_', '_']);
    });

    it('should_reveal_multiple_occurrences', () => {
      const stateWithRepeats = createGame({ word: 'ANANAS' });
      stateWithRepeats.correctLetters.add('A');
      const display = getDisplayWord(stateWithRepeats);

      expect(display).toEqual(['A', '_', 'A', '_', 'A', '_']);
    });

    it('should_preserve_spaces_and_hyphens', () => {
      const stateWithSpace = createGame({ word: 'BON JOUR' });
      const display = getDisplayWord(stateWithSpace);

      expect(display).toEqual(['_', '_', '_', ' ', '_', '_', '_', '_']);
    });
  });

  describe('guessLetter', () => {
    let state: GameState;

    beforeEach(() => {
      state = createGame({ word: 'PENDU' });
    });

    it('should_reveal_letter_when_present_in_word', () => {
      const result = guessLetter(state, 'E');

      expect(result.isCorrect).toBe(true);
      expect(result.letter).toBe('E');
      expect(result.positions).toEqual([1]);
      expect(result.state.correctLetters.has('E')).toBe(true);
      expect(result.state.errors).toBe(0);
    });

    it('should_increment_errors_when_letter_not_in_word', () => {
      const result = guessLetter(state, 'Z');

      expect(result.isCorrect).toBe(false);
      expect(result.positions).toEqual([]);
      expect(result.state.wrongLetters.has('Z')).toBe(true);
      expect(result.state.errors).toBe(1);
    });

    it('should_find_all_positions_of_repeated_letter', () => {
      const stateRepeats = createGame({ word: 'ANANAS' });
      const result = guessLetter(stateRepeats, 'A');

      expect(result.positions).toEqual([0, 2, 4]);
    });

    it('should_handle_case_insensitive_guess', () => {
      const result = guessLetter(state, 'e' as Letter);

      expect(result.isCorrect).toBe(true);
      expect(result.state.correctLetters.has('E')).toBe(true);
    });

    it('should_not_change_state_if_letter_already_guessed', () => {
      const firstGuess = guessLetter(state, 'E');
      const secondGuess = guessLetter(firstGuess.state, 'E');

      expect(secondGuess.state.errors).toBe(firstGuess.state.errors);
      expect(secondGuess.state.correctLetters.size).toBe(firstGuess.state.correctLetters.size);
    });

    it('should_detect_victory_when_word_complete', () => {
      let currentState = state;

      for (const letter of ['P', 'E', 'N', 'D', 'U'] as Letter[]) {
        const result = guessLetter(currentState, letter);
        currentState = result.state;
      }

      expect(currentState.status).toBe('won');
    });

    it('should_detect_defeat_when_max_errors_reached', () => {
      let currentState = state;
      const wrongLetters: Letter[] = ['A', 'B', 'C', 'F', 'G', 'H'];

      for (const letter of wrongLetters) {
        const result = guessLetter(currentState, letter);
        currentState = result.state;
      }

      expect(currentState.errors).toBe(MAX_ERRORS);
      expect(currentState.status).toBe('lost');
    });

    it('should_not_allow_guessing_after_game_over', () => {
      // Win the game
      let currentState = state;
      for (const letter of ['P', 'E', 'N', 'D', 'U'] as Letter[]) {
        const result = guessLetter(currentState, letter);
        currentState = result.state;
      }

      // Try to guess after winning
      const afterWin = guessLetter(currentState, 'Z');
      expect(afterWin.state.errors).toBe(0);
      expect(afterWin.state.wrongLetters.has('Z')).toBe(false);
    });
  });

  describe('isGameOver', () => {
    it('should_return_false_when_playing', () => {
      const state = createGame({ word: 'TEST' });
      expect(isGameOver(state)).toBe(false);
    });

    it('should_return_true_when_won', () => {
      const state = createGame({ word: 'A' });
      const result = guessLetter(state, 'A');
      expect(isGameOver(result.state)).toBe(true);
    });

    it('should_return_true_when_lost', () => {
      let state = createGame({ word: 'Z' });
      const wrongLetters: Letter[] = ['A', 'B', 'C', 'D', 'E', 'F'];

      for (const letter of wrongLetters) {
        const result = guessLetter(state, letter);
        state = result.state;
      }

      expect(isGameOver(state)).toBe(true);
    });
  });

  describe('canGuess', () => {
    it('should_return_true_for_new_letter_while_playing', () => {
      const state = createGame({ word: 'TEST' });
      expect(canGuess(state, 'A')).toBe(true);
    });

    it('should_return_false_for_already_guessed_letter', () => {
      const state = createGame({ word: 'TEST' });
      const result = guessLetter(state, 'T');

      expect(canGuess(result.state, 'T')).toBe(false);
    });

    it('should_return_false_when_game_is_over', () => {
      const state = createGame({ word: 'A' });
      const result = guessLetter(state, 'A');

      expect(canGuess(result.state, 'B')).toBe(false);
    });
  });
});
