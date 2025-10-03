// app/(members)/films/[id]/RealtimeBinder.tsx
'use client';
import { useFilmRealtime } from '@/lib/realtime/useFilmRealtime';

export const RealtimeBinder = ({ filmId, username }: { filmId: number; username: string }) => {
  useFilmRealtime(filmId, username || 'member');
  return null;
};