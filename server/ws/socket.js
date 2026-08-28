import { Server } from 'socket.io';
import { createRedisClient } from '../redis.js';
import {
  WS_CHANNEL,
  WS_EVENTS,
  intentRoom,
  trainRoom,
} from '../../shared/constants.js';

let io = null;

/**
 * Attach Socket.io to the HTTP server and bridge it to the worker via Redis
 * pub/sub. The worker (a separate process) publishes JSON envelopes to
 * WS_CHANNEL; we re-broadcast each to the right room so browsers get live
 * updates. Clients join rooms by emitting `subscribe`.
 *
 * Envelope shape (from worker/notify + worker/index):
 *   { event, room: {type:'intent'|'train', ...ids}, payload }
 */
export function initSocket(httpServer, corsOrigins) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigins, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    socket.on('subscribe', ({ intentId, trainId, class: cls } = {}) => {
      if (intentId) socket.join(intentRoom(intentId));
      if (trainId && cls) socket.join(trainRoom(trainId, cls));
    });
  });

  // Dedicated subscriber connection (ioredis requires a connection in
  // subscriber mode to be separate from the command connection).
  const sub = createRedisClient();
  sub.subscribe(WS_CHANNEL, (err) => {
    if (err) console.error('[ws] failed to subscribe:', err.message);
    else console.log(`[ws] bridged to Redis channel "${WS_CHANNEL}"`);
  });
  sub.on('message', (_channel, raw) => {
    try {
      const { event, room, payload } = JSON.parse(raw);
      const target = roomName(room);
      if (target) io.to(target).emit(event, payload);
      else io.emit(event, payload);
    } catch (e) {
      console.error('[ws] bad envelope:', e.message);
    }
  });

  return io;
}

function roomName(room) {
  if (!room) return null;
  if (room.type === 'intent') return intentRoom(room.intentId);
  if (room.type === 'train') return trainRoom(room.trainId, room.class);
  return null;
}

export function getIo() {
  if (!io) throw new Error('Socket.io not initialised — call initSocket first.');
  return io;
}

// Re-export event names so routes can emit locally if ever needed.
export { WS_EVENTS };
