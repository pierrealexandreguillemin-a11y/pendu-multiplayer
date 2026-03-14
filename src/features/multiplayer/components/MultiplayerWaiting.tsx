'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GlassCard } from '@/components/effects/glass-card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CONNECTION_STATUS_LABELS } from '@/types/game';
import type { ConnectionStatus } from '@/types/game';
import { MAX_PLAYERS } from '@/types/room';

interface MultiplayerWaitingProps {
  peerId: string | null;
  isHost: boolean;
  status: ConnectionStatus;
  connectedPeers: string[];
  onStart: () => void;
  onQuit: () => void;
  /** Path for the join URL (e.g. '/coop', '/pvp') */
  joinPath: string;
  /** Spotlight color for the glass card */
  spotlightColor: string;
  /** Accent color class for the code display (e.g. 'text-green-400', 'text-pink-400') */
  codeColorClass: string;
  /** Button color classes for the start button */
  startButtonClass: string;
  /** Label for the start button when ready */
  startButtonLabel: string;
  /** Label for the start button when waiting */
  startButtonWaitingLabel: string;
  /** Title when hosting */
  hostTitle: string;
  /** Title when joining */
  guestTitle: string;
}

export function MultiplayerWaiting({
  peerId,
  isHost,
  status,
  connectedPeers,
  onStart,
  onQuit,
  joinPath,
  spotlightColor,
  codeColorClass,
  startButtonClass,
  startButtonLabel,
  startButtonWaitingLabel,
  hostTitle,
  guestTitle,
}: MultiplayerWaitingProps) {
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const canStart = isHost && connectedPeers.length > 0;

  const getJoinUrl = (id: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${joinPath}?join=${id}`;
  };

  return (
    <GlassCard className="p-8 max-w-md w-full text-center" spotlightColor={spotlightColor}>
      <h2 className="text-xl font-bold text-white mb-6">{isHost ? hostTitle : guestTitle}</h2>

      {isHost && peerId && (
        <div className="space-y-4 mb-6">
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-xl">
              <QRCodeSVG value={getJoinUrl(peerId)} size={200} level="M" />
            </div>
          </div>
          <p className="text-gray-400 text-sm">Scanne pour rejoindre</p>

          <details className="text-left">
            <summary className="text-gray-400 text-xs cursor-pointer hover:text-gray-200">
              Ou entre le code manuellement
            </summary>
            <div className="mt-2 p-2 bg-white/10 rounded text-center">
              <p className={`text-sm font-mono select-all break-all ${codeColorClass}`}>{peerId}</p>
            </div>
          </details>
        </div>
      )}

      <div className="text-white mb-6">
        <p>
          Joueurs: {connectedPeers.length + 1}/{MAX_PLAYERS}
        </p>
        <p className="text-sm text-gray-400">{CONNECTION_STATUS_LABELS[status]}</p>
      </div>

      {isHost && (
        <Button
          onClick={onStart}
          disabled={!canStart}
          className={`w-full disabled:opacity-50 mb-4 ${startButtonClass}`}
          size="lg"
        >
          {canStart ? (
            startButtonLabel
          ) : (
            <span>
              {startButtonWaitingLabel}
              <span className="block text-xs font-normal opacity-75">En attente de joueurs...</span>
            </span>
          )}
        </Button>
      )}

      <Button onClick={() => setShowQuitConfirm(true)} variant="destructive" size="sm">
        Quitter
      </Button>

      <Dialog open={showQuitConfirm} onOpenChange={setShowQuitConfirm}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Quitter la partie ?</DialogTitle>
            <DialogDescription className="text-gray-400">
              {isHost
                ? 'Les autres joueurs seront déconnectés. Cette action est irréversible.'
                : 'Tu seras déconnecté de la partie.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowQuitConfirm(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={onQuit}>
              Quitter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
