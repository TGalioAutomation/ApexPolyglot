import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'node:http';
import { parseSessionCookie, getSession } from '../auth/service.js';

interface Frame {
  type: string;
  version?: string;
  sessionId?: string;
  turnId?: string;
  sequence?: number;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Realtime voice gateway (TADR-004). Authenticates over the session cookie and
 * implements the documented event contract (technical-architecture 16.3).
 *
 * In this prototype the transcript is echoed back (no live STT provider wired);
 * production replaces the echo with a real STT/LLM/TTS pipeline behind the same
 * frame contract. Barge-in is honored via playback.cancel.v1.
 */
export function attachVoiceGateway(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/v1/voice' });

  wss.on('connection', async (socket, request) => {
    try {
      const session = await getSession(parseSessionCookie(request.headers.cookie));
      if (!session.authenticated) {
        send(socket, { type: 'error.v1', message: 'Unauthorized' });
        socket.close(1008, 'Unauthorized');
        return;
      }
    } catch {
      send(socket, { type: 'error.v1', message: 'Authentication unavailable' });
      socket.close(1011, 'Internal');
      return;
    }

    const context: { turnId: string | null; sequence: number; lastSequence: number } = { turnId: null, sequence: 0, lastSequence: 0 };
    send(socket, { type: 'session.ready.v1', version: 1, capabilities: { transcript: 'echo', tts: false, bargeIn: true } });

    socket.on('message', (raw) => {
      let frame: Frame;
      try {
        frame = JSON.parse(raw.toString());
      } catch {
        send(socket, { type: 'error.v1', message: 'invalid JSON frame' });
        return;
      }
      if (!frame.type) {
        send(socket, { type: 'error.v1', message: 'frame.type required' });
        return;
      }
      switch (frame.type) {
        case 'audio.start.v1':
          context.turnId = String(frame.turnId || `turn-${Date.now()}`);
          context.sequence = 0;
          context.lastSequence = 0;
          send(socket, { type: 'transcript.partial.v1', turnId: context.turnId, text: '' });
          break;
        case 'audio.chunk.v1': {
          const seq = Number(frame.sequence) || 0;
          if (seq === context.lastSequence + 1 || seq === 0) {
            context.lastSequence = seq;
            context.sequence += 1;
          }
          break;
        }
        case 'audio.end.v1':
          // Echo a final transcript placeholder; production STT returns real text.
          send(socket, { type: 'transcript.final.v1', turnId: context.turnId, text: '', confidence: null });
          send(socket, { type: 'turn.completed.v1', turnId: context.turnId });
          break;
        case 'playback.cancel.v1':
          send(socket, { type: 'flow.pause.v1', reason: 'barge-in' });
          break;
        case 'session.close.v1':
          socket.close(1000, 'closed');
          break;
        default:
          send(socket, { type: 'error.v1', message: `unsupported frame type ${frame.type}` });
      }
    });
  });

  return wss;
}

function send(socket: WebSocket, frame: Record<string, unknown>): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ timestamp: new Date().toISOString(), ...frame }));
  }
}
