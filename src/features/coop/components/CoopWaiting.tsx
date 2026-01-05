'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConnectionStatus } from '@/types/game';

interface CoopWaitingProps {
  peerId: string | null;
  isHost: boolean;
  status: ConnectionStatus;
  connectedPeers: string[];
  onStart: () => void;
  onQuit: () => void;
}

export function CoopWaiting({
  peerId,
  isHost,
  status,
  connectedPeers,
  onStart,
  onQuit,
}: CoopWaitingProps) {
  const getJoinUrl = (id: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/coop?join=${id}`;
  };

  return (
    <Card className="w-full max-w-md bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-xl text-white text-center">
          {isHost ? 'Partage ce code' : 'En attente...'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        {isHost && peerId && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-xl">
                <QRCodeSVG value={getJoinUrl(peerId)} size={160} level="M" />
              </div>
            </div>
            <p className="text-gray-400 text-sm">Scanne pour rejoindre</p>

            <details className="text-left">
              <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-300">
                Ou entre le code manuellement
              </summary>
              <div className="mt-2 p-2 bg-white/10 rounded text-center">
                <p className="text-sm font-mono text-green-400 select-all break-all">{peerId}</p>
              </div>
            </details>
          </div>
        )}

        <div className="text-white">
          <p>Joueurs connectés: {connectedPeers.length + 1}</p>
          <p className="text-sm text-gray-400">Status: {status}</p>
        </div>

        {isHost && connectedPeers.length > 0 && (
          <Button onClick={onStart} className="w-full bg-green-500 hover:bg-green-600" size="lg">
            Lancer la partie!
          </Button>
        )}

        <Button onClick={onQuit} variant="destructive" size="sm">
          Quitter
        </Button>
      </CardContent>
    </Card>
  );
}
