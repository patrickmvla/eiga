'use client';

import { useFilmRealtime } from '@/lib/realtime/useFilmRealtime';

export const DashboardRealtimeBinder = ({
  filmId,
  username,
}: {
  filmId: number;
  username: string;
}) => {
  useFilmRealtime(filmId, username || 'member');
  return null;
};