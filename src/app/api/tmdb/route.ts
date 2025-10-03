// app/api/tmdb/route.ts
import { NextResponse } from 'next/server';
import { TMDB_ENABLED, searchMovies, getMovieDetails } from '@/lib/utils/tmdb';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const noStore = { 'cache-control': 'no-store' };

const toBool = (v: string | null) => {
  if (!v) return false;
  const s = v.toLowerCase();
  return s === '1' || s === 'true' || s === 'on' || s === 'yes';
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    const query = searchParams.get('query') ?? searchParams.get('q') ?? '';
    const yearParam = searchParams.get('year');
    const pageParam = searchParams.get('page');
    const includeAdult = toBool(searchParams.get('include_adult'));
    const language = searchParams.get('language') ?? 'en-US';
    const appendParam = searchParams.get('append'); // e.g., 'videos,images'
    const append = appendParam
      ? appendParam.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    // Details
    if (idParam) {
      if (!TMDB_ENABLED) {
        return NextResponse.json(
          { error: 'TMDB not configured. Set TMDB_READ_ACCESS_TOKEN or TMDB_API_KEY.' },
          { status: 503, headers: noStore }
        );
      }
      const tmdbId = Number(idParam);
      if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
        return NextResponse.json({ error: 'Invalid id' }, { status: 400, headers: noStore });
      }
      const details = await getMovieDetails(tmdbId, { language, append });
      return NextResponse.json(details, { status: 200, headers: noStore });
    }

    // Search
    const year = yearParam ? Number(yearParam) : undefined;
    const page = pageParam ? Number(pageParam) : undefined;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] }, { status: 200, headers: noStore });
    }

    if (!TMDB_ENABLED) {
      return NextResponse.json({ results: [] }, { status: 200, headers: noStore });
    }

    const results = await searchMovies(query, {
      year: Number.isFinite(year as number) ? (year as number) : undefined,
      page: Number.isFinite(page as number) ? (page as number) : 1,
      includeAdult,
      language,
    });

    return NextResponse.json({ results }, { status: 200, headers: noStore });
  } catch (e) {
    return NextResponse.json(
      { error: 'TMDB request failed', detail: e instanceof Error ? e.message : String(e) },
      { status: 500, headers: noStore }
    );
  }
}