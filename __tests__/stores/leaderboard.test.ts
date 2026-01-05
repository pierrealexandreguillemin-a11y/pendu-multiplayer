import { describe, it, expect, beforeEach } from 'vitest';
import { useLeaderboardStore } from '@/stores/leaderboard';
import { safeValidateLeaderboardEntry } from '@/lib/message-validation';

describe('LeaderboardStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useLeaderboardStore.getState().clearAll();
  });

  describe('addEntry', () => {
    it('should_add_entry_to_correct_mode', () => {
      const { addEntry, getTopScores } = useLeaderboardStore.getState();

      addEntry({
        playerName: 'Alice',
        mode: 'solo',
        score: 8,
        word: 'ELEPHANT',
        errors: 2,
        won: true,
      });

      const scores = getTopScores('solo');
      expect(scores).toHaveLength(1);
      expect(scores[0]?.playerName).toBe('Alice');
      expect(scores[0]?.score).toBe(8);
    });

    it('should_sort_by_score_descending', () => {
      const { addEntry, getTopScores } = useLeaderboardStore.getState();

      addEntry({ playerName: 'Low', mode: 'solo', score: 3, word: 'CAT', errors: 1, won: true });
      addEntry({
        playerName: 'High',
        mode: 'solo',
        score: 10,
        word: 'BASKETBALL',
        errors: 0,
        won: true,
      });
      addEntry({ playerName: 'Mid', mode: 'solo', score: 5, word: 'PENDU', errors: 2, won: true });

      const scores = getTopScores('solo');
      expect(scores[0]?.playerName).toBe('High');
      expect(scores[1]?.playerName).toBe('Mid');
      expect(scores[2]?.playerName).toBe('Low');
    });

    it('should_sort_by_errors_ascending_when_scores_equal', () => {
      const { addEntry, getTopScores } = useLeaderboardStore.getState();

      addEntry({
        playerName: 'MoreErrors',
        mode: 'solo',
        score: 5,
        word: 'PENDU',
        errors: 4,
        won: true,
      });
      addEntry({
        playerName: 'LessErrors',
        mode: 'solo',
        score: 5,
        word: 'PENDU',
        errors: 1,
        won: true,
      });

      const scores = getTopScores('solo');
      expect(scores[0]?.playerName).toBe('LessErrors');
      expect(scores[1]?.playerName).toBe('MoreErrors');
    });

    it('should_keep_only_top_10_entries', () => {
      const { addEntry, getTopScores } = useLeaderboardStore.getState();

      // Add 12 entries
      for (let i = 1; i <= 12; i++) {
        addEntry({
          playerName: `Player${i}`,
          mode: 'solo',
          score: i,
          word: 'TEST',
          errors: 0,
          won: true,
        });
      }

      const scores = getTopScores('solo');
      expect(scores).toHaveLength(10);
      // Should have top 10 (scores 12 down to 3)
      expect(scores[0]?.score).toBe(12);
      expect(scores[9]?.score).toBe(3);
    });

    it('should_record_defeats_with_zero_score', () => {
      const { addEntry, getTopScores } = useLeaderboardStore.getState();

      addEntry({
        playerName: 'Loser',
        mode: 'solo',
        score: 0,
        word: 'DIFFICULT',
        errors: 6,
        won: false,
      });

      const scores = getTopScores('solo');
      expect(scores).toHaveLength(1);
      expect(scores[0]?.won).toBe(false);
      expect(scores[0]?.score).toBe(0);
    });

    it('should_separate_entries_by_mode', () => {
      const { addEntry, getTopScores } = useLeaderboardStore.getState();

      addEntry({
        playerName: 'SoloPlayer',
        mode: 'solo',
        score: 5,
        word: 'TEST',
        errors: 0,
        won: true,
      });
      addEntry({
        playerName: 'CoopPlayer',
        mode: 'coop',
        score: 7,
        word: 'TESTING',
        errors: 1,
        won: true,
      });
      addEntry({
        playerName: 'PvPPlayer',
        mode: 'pvp',
        score: 3,
        word: 'CAT',
        errors: 2,
        won: true,
      });

      expect(getTopScores('solo')).toHaveLength(1);
      expect(getTopScores('coop')).toHaveLength(1);
      expect(getTopScores('pvp')).toHaveLength(1);

      expect(getTopScores('solo')[0]?.playerName).toBe('SoloPlayer');
      expect(getTopScores('coop')[0]?.playerName).toBe('CoopPlayer');
      expect(getTopScores('pvp')[0]?.playerName).toBe('PvPPlayer');
    });

    it('should_generate_unique_ids', () => {
      const { addEntry, getTopScores } = useLeaderboardStore.getState();

      addEntry({ playerName: 'A', mode: 'solo', score: 1, word: 'A', errors: 0, won: true });
      addEntry({ playerName: 'B', mode: 'solo', score: 2, word: 'AB', errors: 0, won: true });

      const scores = getTopScores('solo');
      expect(scores[0]?.id).not.toBe(scores[1]?.id);
    });
  });

  describe('getTopScores', () => {
    it('should_limit_results_when_specified', () => {
      const { addEntry, getTopScores } = useLeaderboardStore.getState();

      for (let i = 1; i <= 5; i++) {
        addEntry({ playerName: `P${i}`, mode: 'solo', score: i, word: 'T', errors: 0, won: true });
      }

      expect(getTopScores('solo', 3)).toHaveLength(3);
      expect(getTopScores('solo', 3)[0]?.score).toBe(5);
    });

    it('should_return_empty_array_for_empty_mode', () => {
      const { getTopScores } = useLeaderboardStore.getState();

      expect(getTopScores('solo')).toEqual([]);
      expect(getTopScores('coop')).toEqual([]);
      expect(getTopScores('pvp')).toEqual([]);
    });
  });

  describe('clearMode', () => {
    it('should_clear_only_specified_mode', () => {
      const { addEntry, getTopScores, clearMode } = useLeaderboardStore.getState();

      addEntry({ playerName: 'Solo', mode: 'solo', score: 5, word: 'TEST', errors: 0, won: true });
      addEntry({ playerName: 'Coop', mode: 'coop', score: 5, word: 'TEST', errors: 0, won: true });

      clearMode('solo');

      expect(getTopScores('solo')).toHaveLength(0);
      expect(getTopScores('coop')).toHaveLength(1);
    });
  });

  describe('clearAll', () => {
    it('should_clear_all_modes', () => {
      const { addEntry, getTopScores, clearAll } = useLeaderboardStore.getState();

      addEntry({ playerName: 'Solo', mode: 'solo', score: 5, word: 'TEST', errors: 0, won: true });
      addEntry({ playerName: 'Coop', mode: 'coop', score: 5, word: 'TEST', errors: 0, won: true });
      addEntry({ playerName: 'PvP', mode: 'pvp', score: 5, word: 'TEST', errors: 0, won: true });

      clearAll();

      expect(getTopScores('solo')).toHaveLength(0);
      expect(getTopScores('coop')).toHaveLength(0);
      expect(getTopScores('pvp')).toHaveLength(0);
    });
  });
});

describe('LeaderboardEntryValidation', () => {
  it('should_validate_correct_entry', () => {
    const validEntry = {
      id: 'test-123',
      playerName: 'Alice',
      mode: 'solo',
      score: 8,
      word: 'ELEPHANT',
      errors: 2,
      won: true,
      timestamp: Date.now(),
    };

    const result = safeValidateLeaderboardEntry(validEntry);
    expect(result).not.toBeNull();
    expect(result?.playerName).toBe('Alice');
  });

  it('should_reject_empty_playerName', () => {
    const invalidEntry = {
      id: 'test-123',
      playerName: '',
      mode: 'solo',
      score: 8,
      word: 'TEST',
      errors: 2,
      won: true,
      timestamp: Date.now(),
    };

    expect(safeValidateLeaderboardEntry(invalidEntry)).toBeNull();
  });

  it('should_reject_invalid_mode', () => {
    const invalidEntry = {
      id: 'test-123',
      playerName: 'Alice',
      mode: 'invalid',
      score: 8,
      word: 'TEST',
      errors: 2,
      won: true,
      timestamp: Date.now(),
    };

    expect(safeValidateLeaderboardEntry(invalidEntry)).toBeNull();
  });

  it('should_reject_negative_score', () => {
    const invalidEntry = {
      id: 'test-123',
      playerName: 'Alice',
      mode: 'solo',
      score: -5,
      word: 'TEST',
      errors: 2,
      won: true,
      timestamp: Date.now(),
    };

    expect(safeValidateLeaderboardEntry(invalidEntry)).toBeNull();
  });

  it('should_reject_errors_above_6', () => {
    const invalidEntry = {
      id: 'test-123',
      playerName: 'Alice',
      mode: 'solo',
      score: 5,
      word: 'TEST',
      errors: 7,
      won: false,
      timestamp: Date.now(),
    };

    expect(safeValidateLeaderboardEntry(invalidEntry)).toBeNull();
  });

  it('should_accept_all_valid_modes', () => {
    const baseEntry = {
      id: 'test-123',
      playerName: 'Alice',
      score: 5,
      word: 'TEST',
      errors: 2,
      won: true,
      timestamp: Date.now(),
    };

    expect(safeValidateLeaderboardEntry({ ...baseEntry, mode: 'solo' })).not.toBeNull();
    expect(safeValidateLeaderboardEntry({ ...baseEntry, mode: 'coop' })).not.toBeNull();
    expect(safeValidateLeaderboardEntry({ ...baseEntry, mode: 'pvp' })).not.toBeNull();
  });
});
