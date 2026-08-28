import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Subscribe to live updates for an intent and/or a train-class. Wires the three
 * server events (intent:update, seats:update, notify) to the handlers you pass.
 *
 * STUB NOTE: connection + subscribe is real; LiveStatus.jsx should call this
 * with real handlers to render the queue position and seat counter.
 *
 * @param {{intentId?:string, trainId?:string, class?:string}} sub
 * @param {{onIntentUpdate?:fn, onSeatsUpdate?:fn, onNotify?:fn}} handlers
 */
export function useSocket(sub, handlers = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_BASE || '/', { transports: ['websocket', 'polling'] });
    ref.current = socket;

    socket.on('connect', () => socket.emit('subscribe', sub));
    if (handlers.onIntentUpdate) socket.on('intent:update', handlers.onIntentUpdate);
    if (handlers.onSeatsUpdate) socket.on('seats:update', handlers.onSeatsUpdate);
    if (handlers.onNotify) socket.on('notify', handlers.onNotify);

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub?.intentId, sub?.trainId, sub?.class]);

  return ref;
}
