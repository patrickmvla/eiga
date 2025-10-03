// components/films/types.ts
export type FilmItem = {
  id: number;
  title: string;
  year: number;
  director?: string | null;
  posterUrl?: string | null;
  avgScore: number;
  dissent: number;
  myScore?: number | null;
  genres: string[];
  country: string; // e.g., 'US', 'FR'
  reviewsSample?: string[];
  discussionsSample?: string[];
};