'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Peer, { DataConnection } from 'peerjs';
import type { GameMessage, ConnectionStatus } from '@/types/game';
import { safeValidateGameMessage } from '@/lib/message-validation';

interface UsePeerConnectionReturn {
  peerId: string | null;
  status: ConnectionStatus;
  error: string | null;
  isHost: boolean;
  connectedPeers: string[];
  createRoom: () => Promise<string>;
  joinRoom: (hostId: string) => Promise<void>;
  sendMessage: (message: GameMessage) => void;
  disconnect: () => void;
  onMessage: (handler: (message: GameMessage, fromId: string) => void) => void;
}

export function usePeerConnection(): UsePeerConnectionReturn {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const messageHandlerRef = useRef<((message: GameMessage, fromId: string) => void) | null>(null);

  const setupConnection = useCallback((conn: DataConnection) => {
    conn.on('open', () => {
      connectionsRef.current.set(conn.peer, conn);
      setConnectedPeers(Array.from(connectionsRef.current.keys()));
      setStatus('connected');
    });

    conn.on('data', (data) => {
      if (messageHandlerRef.current) {
        const validatedMessage = safeValidateGameMessage(data);
        if (validatedMessage) {
          messageHandlerRef.current(validatedMessage, conn.peer);
        } else {
          console.warn('[PeerConnection] Invalid message received:', data);
        }
      }
    });

    conn.on('close', () => {
      connectionsRef.current.delete(conn.peer);
      setConnectedPeers(Array.from(connectionsRef.current.keys()));
      if (connectionsRef.current.size === 0) {
        setStatus('disconnected');
      }
    });

    conn.on('error', (err) => {
      setError(err.message);
    });
  }, []);

  const createRoom = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      setStatus('connecting');
      setIsHost(true);

      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', (id) => {
        setPeerId(id);
        setStatus('connected');
        resolve(id);
      });

      peer.on('connection', (conn) => {
        setupConnection(conn);
      });

      peer.on('error', (err) => {
        setError(err.message);
        setStatus('error');
        reject(err);
      });
    });
  }, [setupConnection]);

  const joinRoom = useCallback(
    (hostId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        setStatus('connecting');
        setIsHost(false);

        const peer = new Peer();
        peerRef.current = peer;

        peer.on('open', (id) => {
          setPeerId(id);
          const conn = peer.connect(hostId, { reliable: true });
          setupConnection(conn);

          conn.on('open', () => resolve());
          conn.on('error', (err) => reject(err));
        });

        peer.on('error', (err) => {
          setError(err.message);
          setStatus('error');
          reject(err);
        });
      });
    },
    [setupConnection]
  );

  const sendMessage = useCallback((message: GameMessage) => {
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }, []);

  const disconnect = useCallback(() => {
    connectionsRef.current.forEach((conn) => conn.close());
    connectionsRef.current.clear();
    peerRef.current?.destroy();
    peerRef.current = null;
    setPeerId(null);
    setStatus('disconnected');
    setConnectedPeers([]);
    setIsHost(false);
  }, []);

  const onMessage = useCallback((handler: (message: GameMessage, fromId: string) => void) => {
    messageHandlerRef.current = handler;
  }, []);

  useEffect(() => {
    return () => {
      peerRef.current?.destroy();
    };
  }, []);

  return {
    peerId,
    status,
    error,
    isHost,
    connectedPeers,
    createRoom,
    joinRoom,
    sendMessage,
    disconnect,
    onMessage,
  };
}
