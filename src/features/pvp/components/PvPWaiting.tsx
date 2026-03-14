'use client';

import { MultiplayerWaiting } from '@/features/multiplayer';
import type { ConnectionStatus } from '@/types/game';

interface PvPWaitingProps {
  peerId: string | null;
  isHost: boolean;
  status: ConnectionStatus;
  connectedPeers: string[];
  onStartWordInput: () => void;
  onQuit: () => void;
}

export function PvPWaiting({ onStartWordInput, ...props }: PvPWaitingProps) {
  return (
    <MultiplayerWaiting
      {...props}
      onStart={onStartWordInput}
      joinPath="/pvp"
      spotlightColor="rgba(236, 72, 153, 0.15)"
      codeColorClass="text-pink-400"
      startButtonClass="bg-pink-700 hover:bg-pink-800"
      startButtonLabel="Choisir le mot"
      startButtonWaitingLabel="Choisir le mot"
      hostTitle="Invite des joueurs"
      guestTitle="En attente du mot..."
    />
  );
}
