'use client';

import { useState } from 'react';
import { useLeaderboardStore } from '@/stores/leaderboard';
import type { GameMode } from '@/types/game';
import { GlassCard } from '@/components/effects/glass-card';

/** Simple password for clear protection - ISO/IEC 25010 Error Prevention */
const CLEAR_PASSWORD = 'Papa';

interface LeaderboardProps {
  mode: GameMode;
  onClose: () => void;
  spotlightColor?: string;
}

/**
 * Leaderboard modal showing top scores for a game mode
 * Follows glassmorphism theme
 */
export function Leaderboard({ mode, onClose, spotlightColor }: LeaderboardProps) {
  const { getTopScores, clearMode } = useLeaderboardStore();
  const entries = getTopScores(mode, 10);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const modeLabels: Record<GameMode, string> = {
    solo: 'Solo',
    coop: 'Coop',
    pvp: 'PvP',
  };

  const modeColors: Record<GameMode, string> = {
    solo: 'text-blue-400',
    coop: 'text-green-400',
    pvp: 'text-pink-400',
  };

  const handleClearClick = () => {
    setShowConfirm(true);
    setPassword('');
    setPasswordError(false);
  };

  const handleClearConfirm = () => {
    if (password === CLEAR_PASSWORD) {
      clearMode(mode);
      setShowConfirm(false);
      setPassword('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleClearCancel = () => {
    setShowConfirm(false);
    setPassword('');
    setPasswordError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard
        className="p-6 max-w-md w-full max-h-[80vh] overflow-hidden"
        spotlightColor={spotlightColor}
        hoverScale={false}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${modeColors[mode]}`}>Classement {modeLabels[mode]}</h2>
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
            Aucun score enregistre.
            <br />
            Gagne une partie pour apparaitre ici !
          </p>
        ) : (
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
                  <tr
                    key={entry.id}
                    className={`
                      border-b border-white/5
                      ${index === 0 ? 'text-yellow-400' : ''}
                      ${index === 1 ? 'text-gray-300' : ''}
                      ${index === 2 ? 'text-amber-600' : ''}
                      ${index > 2 ? 'text-gray-400' : ''}
                    `}
                  >
                    <td className="py-2 font-mono">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `${index + 1}.`}
                    </td>
                    <td className="py-2 truncate max-w-[120px]" title={entry.playerName}>
                      {entry.playerName}
                    </td>
                    <td className="py-2 text-right font-bold">{entry.score}</td>
                    <td className="py-2 text-right text-sm">{entry.errors}/6</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              onClick={handleClearClick}
              className="py-2 px-4 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 transition-colors text-sm"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Confirmation modal with password - ISO/IEC 25010 Error Prevention */}
        {showConfirm && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm mb-3">
              Effacer tous les scores {modeLabels[mode]} ?
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleClearConfirm()}
              placeholder="Mot de passe"
              className={`w-full mb-3 px-3 py-2 bg-white/10 border rounded text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 ${
                passwordError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-white/20 focus:ring-red-500/50'
              }`}
              autoFocus
            />
            {passwordError && <p className="text-red-400 text-xs mb-2">Mot de passe incorrect</p>}
            <div className="flex gap-2">
              <button
                onClick={handleClearConfirm}
                disabled={!password}
                className="flex-1 py-2 px-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white text-sm font-medium transition-colors"
              >
                Confirmer
              </button>
              <button
                onClick={handleClearCancel}
                className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded text-gray-300 text-sm transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
