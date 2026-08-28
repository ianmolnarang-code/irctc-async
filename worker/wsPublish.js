import { WS_CHANNEL } from '../shared/constants.js';

/**
 * Publish a UI event envelope to the Redis pub/sub channel. The API server is
 * subscribed and re-broadcasts to the right Socket.io room. Keeping this in one
 * place means the worker never imports Socket.io.
 *
 * Envelope: { event:string, room:{type,'intent'|'train',...ids}, payload:object }
 */
export function publishWs(redisPub, envelope) {
  return redisPub.publish(WS_CHANNEL, JSON.stringify(envelope));
}
