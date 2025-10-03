// components/films/types.ts
export type FilmItem = {
  id: number;
  title: string;
  year: number;
  director?: string | null;
  posterUrl?: string | null;
  avgScore?: number | null;   // accept null
  dissent?: number | null;    // accept null
  myScore?: number | null;    // already optional/null
  genres: string[];
  country: string;            // e.g., 'US', 'FR'
  reviewsSample?: string[];
  discussionsSample?: string[];
};