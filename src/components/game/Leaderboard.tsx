'use client';

import { useState } from 'react';
import { useLeaderboardStore } from '@/stores/leaderboard';
import type { GameMode, LeaderboardEntry } from '@/types/game';
import { GlassCard } from '@/components/effects/glass-card';

/** Simple password for clear protection - ISO/IEC 25010 Error Prevention */
const CLEAR_PASSWORD = 'Papa';

interface LeaderboardProps {
  mode: GameMode;
  onClose: () => void;
  spotlightColor?: string;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];

function rankColor(index: number): string {
  return RANK_COLORS[index] ?? 'text-gray-400';
}

function rankLabel(index: number): string {
  return RANK_MEDALS[index] ?? `${index + 1}.`;
}

interface EntriesTableProps {
  entries: LeaderboardEntry[];
}

function EntriesTable({ entries }: EntriesTableProps) {
  return (
    <div className="overflow-y-auto max-h-[50vh]">
      <table className="w-full">
        <thead>
          <tr className="text-gray-400 text-sm border-b border-white/10">
            <th className="text-left py-2 w-8">#</th>
            <th className="text-left py-2">Joueur</th>
            <th className="text-right py-2">Score</th>
            <th className="text-right py-2">Erreurs</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={entry.id} className={`border-b border-white/5 ${rankColor(index)}`}>
              <td className="py-2 font-mono">{rankLabel(index)}</td>
              <td className="py-2 truncate max-w-[120px]" title={entry.playerName}>
                {entry.playerName}
              </td>
              <td className="py-2 text-right font-bold">{entry.score}</td>
              <td className="py-2 text-right text-sm">
                {entry.errors}/{entry.maxErrors ?? 6}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ClearConfirmProps {
  modeName: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

function ClearConfirm({ modeName, onConfirm, onCancel }: ClearConfirmProps) {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const handleConfirm = () => {
    onConfirm(password);
    setPasswordError(password !== CLEAR_PASSWORD);
  };

  return (
    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <p className="text-red-300 text-sm mb-3">Effacer tous les scores {modeName} ?</p>
      <input
        type="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setPasswordError(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        placeholder="Mot de passe"
        className={`w-full mb-3 px-3 py-2 bg-white/10 border rounded text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 ${passwordError ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-red-500/50'}`}
        autoFocus
      />
      {passwordError && <p className="text-red-400 text-xs mb-2">Mot de passe incorrect</p>}
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={!password}
          className="flex-1 py-2 px-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white text-sm font-medium transition-colors"
        >
          Confirmer
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded text-gray-300 text-sm transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

const MODE_LABELS: Record<GameMode, string> = { solo: 'Solo', coop: 'Coop', pvp: 'PvP' };
const MODE_COLORS: Record<GameMode, string> = {
  solo: 'text-blue-400',
  coop: 'text-green-400',
  pvp: 'text-pink-400',
};

/**
 * Leaderboard modal showing top scores for a game mode
 * Follows glassmorphism theme
 */
export function Leaderboard({ mode, onClose, spotlightColor }: LeaderboardProps) {
  const { getTopScores, clearMode } = useLeaderboardStore();
  const entries = getTopScores(mode, 10);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearConfirm = (password: string) => {
    if (password === CLEAR_PASSWORD) {
      clearMode(mode);
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard
        className="p-6 max-w-md w-full max-h-[80vh] overflow-hidden"
        spotlightColor={spotlightColor}
        hoverScale={false}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${MODE_COLORS[mode]}`}>
            Classement {MODE_LABELS[mode]}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Aucun score enregistré.
            <br />
            Gagne une partie pour apparaître ici !
          </p>
        ) : (
          <EntriesTable entries={entries} />
        )}

        <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Fermer
          </button>
          {entries.length > 0 && !showConfirm && (
            <button
              onClick={() => setShowConfirm(true)}
              className="py-2 px-4 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 transition-colors text-sm"
            >
              Effacer
            </button>
          )}
        </div>

        {showConfirm && (
          <ClearConfirm
            modeName={MODE_LABELS[mode]}
            onConfirm={handleClearConfirm}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </GlassCard>
    </div>
  );
}
