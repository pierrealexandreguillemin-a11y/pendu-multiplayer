'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Peer, { DataConnection } from 'peerjs';
import type { GameMessage, ConnectionStatus } from '@/types/game';
import { safeValidateGameMessage } from '@/lib/message-validation';

type MessageHandler = (message: GameMessage, fromId: string) => void;
type DisconnectHandler = (peerId: string) => void;

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
  onMessage: (handler: MessageHandler) => void;
  offMessage: () => void;
  onPeerDisconnect: (handler: DisconnectHandler) => void;
  offPeerDisconnect: () => void;
}

// ISO/IEC 25010 - Reliability: Limit buffer to prevent memory issues
const MAX_BUFFERED_MESSAGES = 50;
const JOIN_TIMEOUT_MS = 10000; // 10 seconds timeout for joining

/**
 * ISO/IEC 25010 - Reliability: Improved peer connection hook with message buffering
 * Messages received before handler registration are buffered and processed when handler is set
 */
export function usePeerConnection(): UsePeerConnectionReturn {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const messageHandlerRef = useRef<MessageHandler | null>(null);
  // ISO/IEC 25010 - Reliability: Buffer messages received before handler is registered
  const messageBufferRef = useRef<Array<{ message: GameMessage; fromId: string }>>([]);
  // ISO/IEC 25010 - Reliability: Notify when a peer disconnects
  const disconnectHandlerRef = useRef<DisconnectHandler | null>(null);

  const setupConnection = useCallback((conn: DataConnection) => {
    conn.on('open', () => {
      connectionsRef.current.set(conn.peer, conn);
      setConnectedPeers(Array.from(connectionsRef.current.keys()));
      setStatus('connected');
    });

    conn.on('data', (data) => {
      const validatedMessage = safeValidateGameMessage(data);
      if (!validatedMessage) {
        console.warn('[PeerConnection] Invalid message received:', data);
        return;
      }

      // ISO/IEC 25010 - Reliability: Buffer or deliver message based on handler state
      if (messageHandlerRef.current) {
        messageHandlerRef.current(validatedMessage, conn.peer);
      } else {
        // Buffer message if handler not yet registered (with limit)
        if (messageBufferRef.current.length < MAX_BUFFERED_MESSAGES) {
          messageBufferRef.current.push({ message: validatedMessage, fromId: conn.peer });
        } else {
          console.warn('[PeerConnection] Message buffer full, dropping message');
        }
      }
    });

    conn.on('close', () => {
      const disconnectedPeerId = conn.peer;
      connectionsRef.current.delete(disconnectedPeerId);
      setConnectedPeers(Array.from(connectionsRef.current.keys()));

      // ISO/IEC 25010 - Reliability: Notify about disconnected peer
      if (disconnectHandlerRef.current) {
        disconnectHandlerRef.current(disconnectedPeerId);
      }

      if (connectionsRef.current.size === 0) {
        setStatus('disconnected');
      }
    });

    conn.on('error', (err) => {
      console.error('[PeerConnection] Connection error:', err.message);
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

        // ISO/IEC 25010 - Reliability: Timeout to prevent infinite waiting
        const timeoutId = setTimeout(() => {
          peerRef.current?.destroy();
          setError('Connection timeout - host may not exist');
          setStatus('error');
          reject(new Error('Connection timeout'));
        }, JOIN_TIMEOUT_MS);

        const peer = new Peer();
        peerRef.current = peer;

        peer.on('open', (id) => {
          setPeerId(id);
          const conn = peer.connect(hostId, { reliable: true });
          setupConnection(conn);

          conn.on('open', () => {
            clearTimeout(timeoutId);
            resolve();
          });
          conn.on('error', (err) => {
            clearTimeout(timeoutId);
            reject(err);
          });
        });

        peer.on('error', (err) => {
          clearTimeout(timeoutId);
          setError(err.message);
          setStatus('error');
          reject(err);
        });
      });
    },
    [setupConnection]
  );

  // ISO/IEC 25010 - Reliability: Clone connections before iterating to prevent race condition
  // If a connection closes during iteration, the cloned array remains stable
  const sendMessage = useCallback((message: GameMessage) => {
    const connections = Array.from(connectionsRef.current.values());
    connections.forEach((conn) => {
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
    setError(null);
    // ISO/IEC 25010 - Reliability: Clear message buffer on disconnect
    messageBufferRef.current = [];
    messageHandlerRef.current = null;
  }, []);

  const onMessage = useCallback((handler: MessageHandler) => {
    messageHandlerRef.current = handler;

    // ISO/IEC 25010 - Reliability: Process any buffered messages
    if (messageBufferRef.current.length > 0) {
      const bufferedMessages = [...messageBufferRef.current];
      messageBufferRef.current = [];
      bufferedMessages.forEach(({ message, fromId }) => {
        handler(message, fromId);
      });
    }
  }, []);

  const offMessage = useCallback(() => {
    messageHandlerRef.current = null;
    // Clear buffer when handler is removed
    messageBufferRef.current = [];
  }, []);

  const onPeerDisconnect = useCallback((handler: DisconnectHandler) => {
    disconnectHandlerRef.current = handler;
  }, []);

  const offPeerDisconnect = useCallback(() => {
    disconnectHandlerRef.current = null;
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
    offMessage,
    onPeerDisconnect,
    offPeerDisconnect,
  };
}
