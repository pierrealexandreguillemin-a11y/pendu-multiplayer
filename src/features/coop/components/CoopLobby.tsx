'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface CoopLobbyProps {
  playerName: string;
  joinId: string;
  isConnecting?: boolean;
  error?: string | null;
  onPlayerNameChange: (name: string) => void;
  onJoinIdChange: (id: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

/** Inline spinner component - ISO/IEC 25065 - Feedback utilisateur */
function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin h-5 w-5 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function CoopLobby({
  playerName,
  joinId,
  isConnecting = false,
  error = null,
  onPlayerNameChange,
  onJoinIdChange,
  onCreateRoom,
  onJoinRoom,
}: CoopLobbyProps) {
  const canCreate = playerName.trim().length > 0 && !isConnecting;
  const canJoin = playerName.trim().length > 0 && joinId.trim().length > 0 && !isConnecting;

  return (
    <Card className="w-full max-w-md bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-2xl text-white text-center">Mode Coop</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ISO/IEC 25065 - Affichage erreur connexion */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <Input
          placeholder="Ton pseudo"
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          disabled={isConnecting}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
        />

        <div className="space-y-3">
          <Button
            onClick={onCreateRoom}
            disabled={!canCreate}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <Spinner className="text-white" />
                Connexion...
              </span>
            ) : (
              'Créer une partie'
            )}
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-gray-400 text-sm">ou</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <Input
            placeholder="Code de la partie"
            value={joinId}
            onChange={(e) => onJoinIdChange(e.target.value)}
            disabled={isConnecting}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
          />
          <Button
            onClick={onJoinRoom}
            disabled={!canJoin}
            variant="outline"
            className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <Spinner />
                Connexion...
              </span>
            ) : (
              'Rejoindre'
            )}
          </Button>
        </div>

        <Link
          href="/"
          className={`block text-center text-gray-400 hover:text-white ${isConnecting ? 'pointer-events-none opacity-50' : ''}`}
        >
          ← Retour
        </Link>
      </CardContent>
    </Card>
  );
}
