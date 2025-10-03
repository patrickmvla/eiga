/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/db/queries.ts
import { and, desc, eq, gte, ilike, inArray, isNotNull, lt, or, sql, SQL } from 'drizzle-orm';
import {
    discussions,
    films,
    filmStatusEnum,
    ratings,
    suggestions,
    users,
    watchStatus,
} from '../../drizzle/schema';
import { db } from './client';

// Constants
export const CLUB_CAPACITY = 10;

// Helpers
// const round1 = (expr: SQL<unknown>) => sql<number | null>`ROUND((${expr})::numeric, 1)`;
// const round0 = (expr: SQL<unknown>) => sql<number | null>`ROUND((${expr})::numeric, 0)`;

// Average and stddev aggregations for film ratings
const ratingAgg = db.$with('rating_agg').as(
  db
    .select({
      filmId: ratings.filmId,
      avgScore: sql<number | null>`ROUND(AVG(${ratings.score})::numeric, 1)`,
      dissent: sql<number | null>`ROUND(COALESCE(stddev_pop(${ratings.score}), 0)::numeric, 1)`,
      ratingsCount: sql<number>`COUNT(*)::int`,
    })
    .from(ratings)
    .groupBy(ratings.filmId)
);

// Compute Monday (00:00) of the current week as YYYY-MM-DD (for week_start)
export const getCurrentMondayYmd = (): string => {
  const now = new Date();
  const day = now.getDay(); // 0 Sun, 1 Mon...
  const monday = new Date(now);
  const diffToMon = (day + 6) % 7;
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diffToMon);
  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Compute next Monday YYYY-MM-DD
export const getNextMondayYmd = (): string => {
  const monday = new Date(getCurrentMondayYmd());
  monday.setDate(monday.getDate() + 7);
  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// -----------------------------------------------------------------------------
// Public: Landing
// -----------------------------------------------------------------------------

export type PublicLandingData = {
  currentFilm: {
    id: number;
    title: string;
    year: number;
    posterUrl: string | null;
    weekStart: string; // YYYY-MM-DD
  } | null;
  seatsAvailable: number;
  stats: {
    members: number;
    capacity: number;
    participation: number; // %
    avgReviewLength: number | null; // words (approx)
  };
  excerpts: { id: number; text: string }[];
  recentFilms: {
    id: number;
    title: string;
    year: number;
    posterUrl: string | null;
    avgScore: number | null;
    dissent: number | null;
  }[];
};

export const getPublicLandingData = async (): Promise<PublicLandingData> => {
  // Active members
  const membersResult = await db
    .select({ cnt: sql<number>`COUNT(*)::int` })
    .from(users)
    .where(eq(users.isActive, true));
  const members = membersResult[0]?.cnt ?? 0;

  // Current film (fallback to most recent archived/upcoming if no current)
  const current = await db
    .select({
      id: films.id,
      title: films.title,
      year: films.year,
      posterUrl: films.posterUrl,
      weekStart: films.weekStart,
      status: films.status,
    })
    .from(films)
    .where(inArray(films.status, ['current', 'upcoming', 'archived']))
    .orderBy(
      // Prefer current > upcoming > archived, then latest week first
      sql`CASE ${films.status}
            WHEN 'current' THEN 1
            WHEN 'upcoming' THEN 2
            ELSE 3
          END`,
      desc(films.weekStart)
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  // Participation and avg review length for current film (if any)
  let participation = 0;
  let avgReviewLength: number | null = null;

  if (current) {
    const reviewCountResult = await db
      .select({ cnt: sql<number>`COUNT(*)::int` })
      .from(ratings)
      .where(and(eq(ratings.filmId, current.id), isNotNull(ratings.review)));
    const reviewCount = reviewCountResult[0]?.cnt ?? 0;

    participation =
      members > 0 ? Math.round((reviewCount / Math.min(members, CLUB_CAPACITY)) * 100) : 0;

    const avgWordsResult = await db
      .select({
        avg_words: sql<number | null>`ROUND(AVG(array_length(regexp_split_to_array(${ratings.review}, E'\\s+'), 1))::numeric, 0)`,
      })
      .from(ratings)
      .where(and(eq(ratings.filmId, current.id), isNotNull(ratings.review)));

    avgReviewLength = avgWordsResult[0]?.avg_words ?? null;
  }

  // Excerpts: highlighted comments for the current film (up to 3)
  const excerptsRows = current
    ? await db
        .select({ id: discussions.id, text: discussions.content })
        .from(discussions)
        .where(and(eq(discussions.filmId, current.id), eq(discussions.isHighlighted, true)))
        .orderBy(desc(discussions.createdAt))
        .limit(3)
    : [];

  // Recent films (last 8, any status except 'upcoming' future drafts older sorts)
  const recent = await db
    .with(ratingAgg)
    .select({
      id: films.id,
      title: films.title,
      year: films.year,
      posterUrl: films.posterUrl,
      avgScore: ratingAgg.avgScore,
      dissent: ratingAgg.dissent,
      status: films.status,
      weekStart: films.weekStart,
    })
    .from(films)
    .leftJoin(ratingAgg, eq(ratingAgg.filmId, films.id))
    .where(inArray(films.status, ['archived', 'current', 'upcoming']))
    .orderBy(desc(films.weekStart))
    .limit(8);

  const seatsAvailable = Math.max(CLUB_CAPACITY - members, 0);

  return {
    currentFilm: current
      ? {
        id: current.id,
        title: current.title,
        year: current.year,
        posterUrl: current.posterUrl ?? null,
        weekStart: String(current.weekStart),
      }
      : null,
    seatsAvailable,
    stats: {
      members,
      capacity: CLUB_CAPACITY,
      participation,
      avgReviewLength,
    },
    excerpts: excerptsRows.map((e) => ({ id: e.id, text: e.text })),
    recentFilms: recent.map((r) => ({
      id: r.id,
      title: r.title,
      year: r.year,
      posterUrl: r.posterUrl ?? null,
      avgScore: r.avgScore ?? null,
      dissent: r.dissent ?? null,
    })),
  };
};

// -----------------------------------------------------------------------------
// Public: Archive
// -----------------------------------------------------------------------------

export type ArchiveSort = 'recent' | 'rating' | 'dissent' | 'alpha' | 'oldest';
export type ArchiveFilter = 'all' | 'consensus' | 'controversial';

export type PublicArchiveItem = {
  id: number;
  title: string;
  year: number;
  avgScore: number | null;
  dissent: number | null;
  reviewsCount: number;
};

export type PublicArchiveResult = {
  total: number;
  items: PublicArchiveItem[];
};

export const getPublicArchive = async (opts: {
  q?: string;
  filter?: ArchiveFilter;
  decade?: number | 'all';
  sort?: ArchiveSort;
  page?: number;
  perPage?: number;
}): Promise<PublicArchiveResult> => {
  const { q, filter = 'all', decade = 'all', sort = 'recent' } = opts;
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.max(1, Math.min(100, opts.perPage ?? 24));
  const offset = (page - 1) * perPage;

  const whereConds: SQL<unknown>[] = [
    // Show films we've already discussed (archived) or current
    inArray(films.status, ['archived', 'current'] as (typeof filmStatusEnum.enumValues)[number][]),
  ];

  if (q && q.trim().length > 0) {
    whereConds.push(
      or(
        ilike(films.title, `%${q}%`),
        ilike(films.director, `%${q}%`),
        ilike(sql`${films.year}::text`, `%${q}%`)
      ) as SQL<unknown>
    );
  }

  if (decade !== 'all' && decade !== undefined && Number.isFinite(decade)) {
    const startYear = Number(decade);
    whereConds.push(
      and(
        gte(films.year, startYear),
        lt(films.year, startYear + 10)
      ) as SQL<unknown>
    );
  }

  // Base (with aggregates)
  const base = db.with(ratingAgg).select({
    id: films.id,
    title: films.title,
    year: films.year,
    avgScore: ratingAgg.avgScore,
    dissent: ratingAgg.dissent,
    reviewsCount: sql<number>`COALESCE(${ratingAgg.ratingsCount}, 0)::int`,
    weekStart: films.weekStart,
  })
  .from(films)
  .leftJoin(ratingAgg, eq(ratingAgg.filmId, films.id))
  .where(and(...whereConds));

  // Filter consensus/controversial
  const filtered = db.$with('filtered').as(
    db
      .select({
        id: sql<number>`id`,
        title: sql<string>`title`,
        year: sql<number>`year`,
        avgScore: sql<number | null>`avg_score`,
        dissent: sql<number | null>`dissent`,
        reviewsCount: sql<number>`reviews_count`,
        weekStart: sql<string>`week_start`,
      })
      .from(base.as('base'))
      .where(
        filter === 'consensus'
          ? sql`COALESCE(dissent, 0) < 1.2`
          : filter === 'controversial'
          ? sql`COALESCE(dissent, 0) > 2.0`
          : sql`TRUE`
      )
  );

  // Total count
  const totalResult = await db
    .with(filtered)
    .select({ cnt: sql<number>`COUNT(*)::int` })
    .from(filtered);
  const total = totalResult[0]?.cnt ?? 0;

  // Sorting
  let orderExpr = desc(sql`week_start`);
  switch (sort) {
    case 'rating':
      orderExpr = desc(sql`avg_score NULLS LAST`);
      break;
    case 'dissent':
      orderExpr = desc(sql`dissent NULLS LAST`);
      break;
    case 'alpha':
      orderExpr = sql`title ASC`;
      break;
    case 'oldest':
      orderExpr = sql`year ASC, title ASC`;
      break;
    case 'recent':
    default:
      orderExpr = desc(sql`week_start`);
      break;
  }

  const rows = await db
    .with(filtered)
    .select({
      id: sql<number>`id`,
      title: sql<string>`title`,
      year: sql<number>`year`,
      avgScore: sql<number | null>`avg_score`,
      dissent: sql<number | null>`dissent`,
      reviewsCount: sql<number>`reviews_count`,
    })
    .from(filtered)
    .orderBy(orderExpr)
    .limit(perPage)
    .offset(offset);

  return {
    total,
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      year: r.year,
      avgScore: r.avgScore,
      dissent: r.dissent,
      reviewsCount: r.reviewsCount,
    })),
  };
};

// -----------------------------------------------------------------------------
// Members: Films (list)
// -----------------------------------------------------------------------------

export type MemberFilmsSort = ArchiveSort;
export type MemberFilmsFilter = ArchiveFilter;

export type MemberFilmItem = {
  id: number;
  title: string;
  year: number;
  director: string | null;
  posterUrl: string | null;
  avgScore: number | null;
  dissent: number | null;
  myScore: number | null;
};

export type MemberFilmsResult = {
  total: number;
  items: MemberFilmItem[];
};

export const getMemberFilms = async (
  userId: string,
  opts: {
    q?: string;
    filter?: MemberFilmsFilter;
    decade?: number | 'all';
    sort?: MemberFilmsSort;
    page?: number;
    perPage?: number;
  }
): Promise<MemberFilmsResult> => {
  const { q, filter = 'all', sort = 'recent', decade = 'all' } = opts;
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.max(1, Math.min(100, opts.perPage ?? 24));
  const offset = (page - 1) * perPage;

  const whereConds: SQL<unknown>[] = [sql`TRUE`];
  if (q && q.trim().length > 0) {
    whereConds.push(
      or(
        ilike(films.title, `%${q}%`),
        ilike(films.director, `%${q}%`),
        ilike(sql`${films.year}::text`, `%${q}%`)
      ) as SQL<unknown>
    );
  }
  if (decade !== 'all' && decade !== undefined && Number.isFinite(decade)) {
    const startYear = Number(decade);
    whereConds.push(
      and(
        gte(films.year, startYear),
        lt(films.year, startYear + 10)
      ) as SQL<unknown>
    );
  }

  const my = db.$with('my').as(
    db
      .select({
        filmId: ratings.filmId,
        myScore: sql<number | null>`ROUND(MAX(${ratings.score})::numeric, 1)`,
      })
      .from(ratings)
      .where(eq(ratings.userId, userId))
      .groupBy(ratings.filmId)
  );

  const base = db.with(ratingAgg, my).select({
    id: films.id,
    title: films.title,
    year: films.year,
    director: films.director,
    posterUrl: films.posterUrl,
    avgScore: ratingAgg.avgScore,
    dissent: ratingAgg.dissent,
    myScore: sql<number | null>`"my".my_score`,
    weekStart: films.weekStart,
  })
  .from(films)
  .leftJoin(ratingAgg, eq(ratingAgg.filmId, films.id))
  .leftJoin(my, eq(my.filmId, films.id))
  .where(and(...whereConds));

  const filtered = db.$with('filtered_member_films').as(
    db
      .select({
        id: sql<number>`id`,
        title: sql<string>`title`,
        year: sql<number>`year`,
        director: sql<string | null>`director`,
        posterUrl: sql<string | null>`poster_url`,
        avgScore: sql<number | null>`avg_score`,
        dissent: sql<number | null>`dissent`,
        myScore: sql<number | null>`my_score`,
        weekStart: sql<string>`week_start`,
      })
      .from(base.as('b'))
      .where(
        filter === 'consensus'
          ? sql`COALESCE(dissent, 0) < 1.2`
          : filter === 'controversial'
          ? sql`COALESCE(dissent, 0) > 2.0`
          : sql`TRUE`
      )
  );

  const totalResult = await db
    .with(filtered)
    .select({ cnt: sql<number>`COUNT(*)::int` })
    .from(filtered);
  const total = totalResult[0]?.cnt ?? 0;

  let orderExpr = desc(sql`week_start`);
  switch (sort) {
    case 'rating':
      orderExpr = desc(sql`avg_score NULLS LAST`);
      break;
    case 'dissent':
      orderExpr = desc(sql`dissent NULLS LAST`);
      break;
    case 'alpha':
      orderExpr = sql`title ASC`;
      break;
    case 'oldest':
      orderExpr = sql`year ASC, title ASC`;
      break;
    case 'recent':
    default:
      orderExpr = desc(sql`week_start`);
      break;
  }

  const rows = await db
    .with(filtered)
    .select({
      id: sql<number>`id`,
      title: sql<string>`title`,
      year: sql<number>`year`,
      director: sql<string | null>`director`,
      posterUrl: sql<string | null>`poster_url`,
      avgScore: sql<number | null>`avg_score`,
      dissent: sql<number | null>`dissent`,
      myScore: sql<number | null>`my_score`,
    })
    .from(filtered)
    .orderBy(orderExpr)
    .limit(perPage)
    .offset(offset);

  return {
    total,
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      year: r.year,
      director: r.director,
      posterUrl: r.posterUrl,
      avgScore: r.avgScore,
      dissent: r.dissent,
      myScore: r.myScore,
    })),
  };
};

// -----------------------------------------------------------------------------
// Members: Dashboard (current week)
// -----------------------------------------------------------------------------

export type DashboardData = {
  film: {
    id: number;
    title: string;
    year: number;
    director: string | null;
    runtime: number | null;
    posterUrl: string | null;
    weekStart: string; // YYYY-MM-DD
    adminNotes: string | null;
  } | null;
  me: {
    rating: number | null;
    hasReview: boolean;
    watchStatus: 'not_watched' | 'watching' | 'watched' | 'rewatched';
  };
  group: {
    members: number;
    watchedCount: number; // by watch_status OR ratings
    avgScore: number | null;
  };
  memberStatuses: {
    username: string;
    avatarUrl: string | null;
    status: 'not_watched' | 'watching' | 'watched' | 'rewatched';
  }[];
};

export const getDashboardData = async (userId: string): Promise<DashboardData> => {
  // active members
  const membersResult = await db
    .select({ cnt: sql<number>`COUNT(*)::int` })
    .from(users)
    .where(eq(users.isActive, true));
  const members = membersResult[0]?.cnt ?? 0;

  // current film (latest current else latest any)
  const film = await db
    .select({
      id: films.id,
      title: films.title,
      year: films.year,
      director: films.director,
      runtime: films.runtime,
      posterUrl: films.posterUrl,
      weekStart: films.weekStart,
      status: films.status,
      adminNotes: films.adminNotes,
    })
    .from(films)
    .where(inArray(films.status, ['current', 'upcoming', 'archived']))
    .orderBy(
      sql`CASE ${films.status}
            WHEN 'current' THEN 1
            WHEN 'upcoming' THEN 2
            ELSE 3
          END`,
      desc(films.weekStart)
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!film) {
    return {
      film: null,
      me: { rating: null, hasReview: false, watchStatus: 'not_watched' },
      group: { members, watchedCount: 0, avgScore: null },
      memberStatuses: [],
    };
  }

  const myRatingResult = await db
    .select({
      score: sql<number | null>`ROUND(MAX(${ratings.score})::numeric, 1)`,
      hasReview: sql<number>`COALESCE(SUM(CASE WHEN ${ratings.review} IS NOT NULL THEN 1 ELSE 0 END), 0)::int`,
    })
    .from(ratings)
    .where(and(eq(ratings.filmId, film.id), eq(ratings.userId, userId)))
    .limit(1);
  
  const myRatingRow = myRatingResult[0] ?? { score: null, hasReview: 0 };

  // watch statuses for this film
  const ws = await db
    .select({
      username: users.username,
      avatarUrl: users.avatarUrl,
      status: watchStatus.status,
    })
    .from(watchStatus)
    .innerJoin(users, eq(users.id, watchStatus.userId))
    .where(eq(watchStatus.filmId, film.id));

  const watchedCount = ws.filter((w) => w.status === 'watched' || w.status === 'rewatched').length;

  const avgScoreResult = await db
    .select({
      avgScore: sql<number | null>`ROUND(AVG(${ratings.score})::numeric, 1)`,
    })
    .from(ratings)
    .where(eq(ratings.filmId, film.id));
  
  const avgScore = avgScoreResult[0]?.avgScore ?? null;

  // derive my watch status (fallback if none)
  const myWsResult = await db
    .select({ status: watchStatus.status })
    .from(watchStatus)
    .where(and(eq(watchStatus.filmId, film.id), eq(watchStatus.userId, userId)))
    .limit(1);
  
  const myWs = myWsResult[0]?.status ?? 'not_watched';

  return {
    film: {
      id: film.id,
      title: film.title,
      year: film.year,
      director: film.director,
      runtime: film.runtime,
      posterUrl: film.posterUrl,
      weekStart: String(film.weekStart),
      adminNotes: film.adminNotes ?? null,
    },
    me: {
      rating: myRatingRow.score ?? null,
      hasReview: (myRatingRow.hasReview ?? 0) > 0,
      watchStatus: myWs as DashboardData['me']['watchStatus'],
    },
    group: {
      members,
      watchedCount,
      avgScore: avgScore,
    },
    memberStatuses: ws.map((w) => ({
      username: w.username,
      avatarUrl: w.avatarUrl ?? null,
      status: w.status,
    })),
  };
};

// -----------------------------------------------------------------------------
// Members: Film Discussion
// -----------------------------------------------------------------------------

export type FilmDiscussionData = {
  film: {
    id: number;
    title: string;
    year: number;
    director: string | null;
    runtime: number | null;
    posterUrl: string | null;
    weekStart: string;
    adminNotes: string | null; // Plain text (you can store JSON here if you want richer structure)
  };
  stats: {
    avgScore: number | null;
    stdDev: number | null;
    ratings: { username: string; score: number | null }[];
  };
  me: {
    myScore: number | null;
    hasReview: boolean;
    watchStatus: 'not_watched' | 'watching' | 'watched' | 'rewatched';
  };
  reviews: { id: number; user: string; rating: number; excerpt: string; createdAt: string }[];
  threads: {
    id: number;
    title: string;
    createdAt: string;
    comments: {
      id: number;
      user: string;
      content: string;
      hasSpoilers: boolean;
      timestampRef?: number | null;
      reactions?: { insightful: number; controversial: number; brilliant: number };
      replies?: {
        id: number;
        user: string;
        content: string;
        hasSpoilers: boolean;
        timestampRef?: number | null;
        reactions?: { insightful: number; controversial: number; brilliant: number };
      }[];
    }[];
  }[];
};

export const getFilmDiscussionData = async (
  filmId: number,
  userId: string
): Promise<FilmDiscussionData | null> => {
  const film = await db
    .select({
      id: films.id,
      title: films.title,
      year: films.year,
      director: films.director,
      runtime: films.runtime,
      posterUrl: films.posterUrl,
      weekStart: films.weekStart,
      adminNotes: films.adminNotes,
    })
    .from(films)
    .where(eq(films.id, filmId))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!film) return null;

  const statsResult = await db
    .select({
      avgScore: sql<number | null>`ROUND(AVG(${ratings.score})::numeric, 1)`,
      stdDev: sql<number | null>`ROUND(COALESCE(stddev_pop(${ratings.score}), 0)::numeric, 1)`,
    })
    .from(ratings)
    .where(eq(ratings.filmId, filmId));
  
  const stats = statsResult[0] ?? { avgScore: null, stdDev: null };

  const ratingRows = await db
    .select({ username: users.username, score: ratings.score })
    .from(users)
    .leftJoin(ratings, and(eq(ratings.userId, users.id), eq(ratings.filmId, filmId)));

  const myRatingResult = await db
    .select({
      myScore: sql<number | null>`ROUND(MAX(${ratings.score})::numeric, 1)`,
      hasReview: sql<number>`COALESCE(SUM(CASE WHEN ${ratings.review} IS NOT NULL THEN 1 ELSE 0 END), 0)::int`,
    })
    .from(ratings)
    .where(and(eq(ratings.filmId, filmId), eq(ratings.userId, userId)))
    .limit(1);

  const myRow = myRatingResult[0] ?? { myScore: null, hasReview: 0 };

  const myWsResult = await db
    .select({ status: watchStatus.status })
    .from(watchStatus)
    .where(and(eq(watchStatus.filmId, filmId), eq(watchStatus.userId, userId)))
    .limit(1);
  
  const myWs = myWsResult[0]?.status ?? 'not_watched';

  const reviewRows = await db
    .select({
      id: ratings.id,
      user: users.username,
      rating: ratings.score,
      excerpt: ratings.review,
      createdAt: ratings.createdAt,
    })
    .from(ratings)
    .innerJoin(users, eq(users.id, ratings.userId))
    .where(and(eq(ratings.filmId, filmId), isNotNull(ratings.review)))
    .orderBy(desc(ratings.createdAt))
    .limit(20);

  // Fetch all discussion comments for film
  const commentRows = await db
    .select({
      id: discussions.id,
      user: users.username,
      content: discussions.content,
      hasSpoilers: discussions.hasSpoilers,
      timestampRef: discussions.timestampReference,
      parentId: discussions.parentId,
      createdAt: discussions.createdAt,
    })
    .from(discussions)
    .innerJoin(users, eq(users.id, discussions.userId))
    .where(eq(discussions.filmId, filmId))
    .orderBy(desc(discussions.createdAt));

  // Group into threads: top-level = parentId IS NULL
  const byId = new Map<number, any>();
  const roots: any[] = [];
  for (const c of commentRows) {
    const node = {
      id: c.id,
      user: c.user,
      content: c.content,
      hasSpoilers: c.hasSpoilers,
      timestampRef: c.timestampRef,
      createdAt: String(c.createdAt),
      replies: [] as any[],
    };
    byId.set(c.id, node);
  }
  for (const c of commentRows) {
    const node = byId.get(c.id);
    if (c.parentId == null) {
      roots.push({
        id: c.id,
        title: '', // Title not stored; if you want thread titles, store them on top-level comments.
        createdAt: String(c.createdAt),
        comments: [node],
      });
    } else {
      const parent = byId.get(c.parentId);
      if (parent) parent.replies.push(node);
    }
  }

  return {
    film: {
      id: film.id,
      title: film.title,
      year: film.year,
      director: film.director,
      runtime: film.runtime,
      posterUrl: film.posterUrl,
      weekStart: String(film.weekStart),
      adminNotes: film.adminNotes ?? null,
    },
    stats: {
      avgScore: stats.avgScore ?? null,
      stdDev: stats.stdDev ?? null,
      ratings: ratingRows.map((r) => ({ username: r.username, score: r.score ?? null })),
    },
    me: {
      myScore: myRow.myScore ?? null,
      hasReview: (myRow.hasReview ?? 0) > 0,
      watchStatus: myWs as FilmDiscussionData['me']['watchStatus'],
    },
    reviews: reviewRows.map((r) => ({
      id: r.id,
      user: r.user,
      rating: Number(r.rating),
      excerpt: r.excerpt ?? '',
      createdAt: String(r.createdAt),
    })),
    threads: roots,
  };
};

// -----------------------------------------------------------------------------
// Members: Suggest
// -----------------------------------------------------------------------------

export type SuggestPageData = {
  hasSubmittedThisWeek: boolean;
  nextResetAt: string; // ISO date (next Monday 00:00)
  mySuggestions: {
    id: number;
    tmdbId: number;
    title: string;
    pitch: string;
    status: 'pending' | 'selected' | 'rejected' | 'expired';
    weekSuggested: string; // YYYY-MM-DD
  }[];
};

export const getSuggestPageData = async (userId: string): Promise<SuggestPageData> => {
  const thisMonday = getCurrentMondayYmd();
  const nextMonday = getNextMondayYmd();

  const submittedResult = await db
    .select({ cnt: sql<number>`COUNT(*)::int` })
    .from(suggestions)
    .where(
      and(
        eq(suggestions.userId, userId),
        eq(suggestions.weekSuggested, thisMonday)
      )
    );
  
  const submittedThisWeek = submittedResult[0]?.cnt ?? 0;

  const mySuggestions = await db
    .select({
      id: suggestions.id,
      tmdbId: suggestions.tmdbId,
      title: suggestions.title,
      pitch: suggestions.pitch,
      status: suggestions.status,
      weekSuggested: suggestions.weekSuggested,
    })
    .from(suggestions)
    .where(eq(suggestions.userId, userId))
    .orderBy(desc(suggestions.createdAt))
    .limit(20);

  return {
    hasSubmittedThisWeek: submittedThisWeek > 0,
    nextResetAt: new Date(nextMonday).toISOString(),
    mySuggestions: mySuggestions.map((s) => ({
      id: s.id,
      tmdbId: s.tmdbId,
      title: s.title,
      pitch: s.pitch,
      status: s.status,
      weekSuggested: String(s.weekSuggested),
    })),
  };
};