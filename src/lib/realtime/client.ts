// lib/realtime/client.ts
'use client';

import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const REALTIME_ENABLED = Boolean(url && anon);

declare global {
  
  var __eiga_supa_client: SupabaseClient | undefined;
}

/** Singleton browser client (cached across HMR) */
export const supaBrowser: SupabaseClient = (() => {
  if (!REALTIME_ENABLED) {
    throw new Error('Supabase Realtime not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  if (!globalThis.__eiga_supa_client) {
    globalThis.__eiga_supa_client = createClient(url, anon, {
      realtime: { params: { eventsPerSecond: 5 } },
      auth: { persistSession: false }, // we’re not using Supabase Auth here
    });
  }
  return globalThis.__eiga_supa_client;
})();

/** Channel naming convention for films */
export const filmChannelName = (filmId: number) => `film:${filmId}` as const;

/** Event names used in broadcast payloads */
export type FilmRealtimeEvent =
  | 'discussion:new'
  | 'discussion:update'
  | 'reaction:new'
  | 'reaction:remove'
  | 'rating:new'
  | 'rating:update'
  | 'highlight:update';

export type FilmEventPayloadMap = {
  'discussion:new': { filmId: number; commentId: number };
  'discussion:update': { filmId: number; commentId: number };
  'reaction:new': { filmId: number; discussionId: number; user: string; type: 'insightful' | 'controversial' | 'brilliant' };
  'reaction:remove': { filmId: number; discussionId: number; user: string };
  'rating:new': { filmId: number; user: string };
  'rating:update': { filmId: number; user: string };
  'highlight:update': { filmId: number; discussionId: number; highlighted: boolean };
};

type EventHandlers = Partial<{ [K in FilmRealtimeEvent]: (payload: FilmEventPayloadMap[K]) => void }>;

export type JoinFilmOptions = {
  presenceKey?: string; // username or userId; defaults to 'member'
  selfBroadcast?: boolean; // if true, receive your own broadcasts; default false
  on?: EventHandlers;
  onPresenceJoin?: (usersOnline: number) => void;
  onPresenceLeave?: (usersOnline: number) => void;
};

/**
 * Join a film-specific realtime channel (broadcast + presence).
 * Returns helpers to subscribe, emit, and leave.
 */
export const joinFilmChannel = (filmId: number, opts: JoinFilmOptions = {}) => {
  if (!REALTIME_ENABLED) {
    throw new Error('Supabase Realtime not configured.');
  }

  const presenceKey = opts.presenceKey || 'member';
  const channel = supaBrowser.channel(filmChannelName(filmId), {
    config: { broadcast: { self: Boolean(opts.selfBroadcast) }, presence: { key: presenceKey } },
  });

  // Broadcast handlers
  const on = opts.on ?? {};
  const register = <K extends FilmRealtimeEvent>(event: K) => {
    channel.on('broadcast', { event }, (ctx) => {
      try {
        const payload = ctx.payload as FilmEventPayloadMap[K];
        if (on[event]) on[event]!(payload);
      } catch {
        // ignore malformed payloads
      }
    });
  };
  (['discussion:new', 'discussion:update', 'reaction:new', 'reaction:remove', 'rating:new', 'rating:update', 'highlight:update'] as FilmRealtimeEvent[]).forEach(
    (e) => register(e)
  );

  // Presence handlers
  let onlineCount = 0;
  channel
    .on('presence', { event: 'join' }, () => {
      onlineCount += 1;
      opts.onPresenceJoin?.(onlineCount);
    })
    .on('presence', { event: 'leave' }, () => {
      onlineCount = Math.max(0, onlineCount - 1);
      opts.onPresenceLeave?.(onlineCount);
    });

  const subscribe = async () =>
    new Promise<RealtimeChannel>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Realtime subscribe timeout')), 4000);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timer);
          // Send initial presence state (you can include richer metadata)
          channel.track({ user: presenceKey, at: Date.now() }).catch(() => {});
          resolve(channel);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          clearTimeout(timer);
          reject(new Error(`Realtime channel status: ${status}`));
        }
      });
    });

  const leave = async () => {
    try {
      await channel.untrack();
    } catch {}
    await channel.unsubscribe();
  };

  const emit = async <K extends FilmRealtimeEvent>(type: K, payload: FilmEventPayloadMap[K]) => {
    // Clients should only emit lightweight UI signals; server sends authoritative events.
    await channel.send({ type: 'broadcast', event: type, payload });
  };

  return { channel, subscribe, leave, emit };
};