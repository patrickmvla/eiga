// lib/realtime/server.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FilmRealtimeEvent, FilmEventPayloadMap } from './client';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const REALTIME_SERVER_ENABLED = Boolean(url && serviceKey);

let _serverClient: SupabaseClient | null = null;

/** Node/server-only Supabase client using the service role key (do NOT expose to client). */
const supaServer = (): SupabaseClient => {
  if (!REALTIME_SERVER_ENABLED) {
    throw new Error('Supabase Realtime (server) not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  if (!_serverClient) {
    _serverClient = createClient(url, serviceKey, {
      realtime: { params: { eventsPerSecond: 5 } },
      auth: { persistSession: false },
    });
  }
  return _serverClient;
};

export const filmChannelName = (filmId: number) => `film:${filmId}` as const;

/**
 * Broadcast a single event to a film channel.
 * Opens a short-lived subscription, sends the event, and tears down.
 * Suitable for serverless environments; overhead is fine for Eiga’s small scale.
 */
export const broadcastToFilm = async <K extends FilmRealtimeEvent>(
  filmId: number,
  type: K,
  payload: FilmEventPayloadMap[K],
  opts?: { timeoutMs?: number }
): Promise<boolean> => {
  if (!REALTIME_SERVER_ENABLED) return false;

  const client = supaServer();
  const channel = client.channel(filmChannelName(filmId), {
    config: { broadcast: { self: true } },
  });

  const timeoutMs = opts?.timeoutMs ?? 4000;

  const subscribed = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timer);
        resolve(true);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        clearTimeout(timer);
        resolve(false);
      }
    });
  });

  if (!subscribed) {
    try {
      await channel.unsubscribe();
    } catch {}
    return false;
  }

  let ok = false;
  try {
    const res = await channel.send({ type: 'broadcast', event: type, payload });
    ok = res === 'ok';
  } catch {
    ok = false;
  } finally {
    // Clean up the ephemeral channel
    try {
      await channel.unsubscribe();
    } catch {}
  }
  return ok;
};

/** Convenience wrappers for common events */
export const notifyDiscussionNew = (filmId: number, commentId: number) =>
  broadcastToFilm(filmId, 'discussion:new', { filmId, commentId });

export const notifyDiscussionUpdate = (filmId: number, commentId: number) =>
  broadcastToFilm(filmId, 'discussion:update', { filmId, commentId });

export const notifyReactionNew = (
  filmId: number,
  discussionId: number,
  user: string,
  type: 'insightful' | 'controversial' | 'brilliant'
) => broadcastToFilm(filmId, 'reaction:new', { filmId, discussionId, user, type });

export const notifyReactionRemove = (filmId: number, discussionId: number, user: string) =>
  broadcastToFilm(filmId, 'reaction:remove', { filmId, discussionId, user });

export const notifyRatingNew = (filmId: number, user: string) =>
  broadcastToFilm(filmId, 'rating:new', { filmId, user });

export const notifyRatingUpdate = (filmId: number, user: string) =>
  broadcastToFilm(filmId, 'rating:update', { filmId, user });

export const notifyHighlightUpdate = (filmId: number, discussionId: number, highlighted: boolean) =>
  broadcastToFilm(filmId, 'highlight:update', { filmId, discussionId, highlighted });