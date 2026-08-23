import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { logger } from './logger.js';

let wss: WebSocketServer | null = null;

export function createWsServer(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('error', (err) => {
    logger.error({ err }, 'WebSocket Server encountered an error');
  });

  wss.on('connection', (ws) => {
    logger.info('WebSocket client connected');

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('error', (err) => {
      logger.warn({ err: err?.message }, 'WebSocket client connection error');
    });

    ws.on('close', () => {
      logger.info('WebSocket client disconnected');
    });

    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
  });

  logger.info('WebSocket server initialized at /ws');
}

export function broadcast(payload: unknown): void {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

export function getClientCount(): number {
  return wss?.clients.size ?? 0;
}
