// lib/stores/film.store.ts
"use client";

import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

export type WatchStatus = "not_watched" | "watching" | "watched" | "rewatched";

export type FilmMeta = {
  id: number;
  title: string;
  year: number;
  posterUrl?: string | null;
};

export type FilmDrafts = {
  score: number | null; // 1–10
  review: string; // raw text
  updatedAt: number; // ms
};

type FilmState = {
  // UI/context
  current: FilmMeta | null;
  lastVisitedFilmId: number | null;
  spoilersVisible: boolean;

  // Per-film state
  watchStatusByFilm: Record<number, WatchStatus>;
  draftsByFilm: Record<number, FilmDrafts>;

  // Async flags (e.g., saving review, updating status)
  pending: Record<string, boolean>; // key: `${type}:${filmId}`

  // Actions
  setCurrent: (film: FilmMeta | null) => void;
  markVisited: (filmId: number) => void;

  toggleSpoilers: (force?: boolean) => void;

  setWatchStatus: (filmId: number, status: WatchStatus) => void;

  setScoreDraft: (filmId: number, score: number | null) => void;
  setReviewDraft: (filmId: number, review: string) => void;
  importExistingReview: (
    filmId: number,
    score: number | null,
    review: string
  ) => void;
  clearDrafts: (filmId: number) => void;

  setPending: (
    type: "review" | "status",
    filmId: number,
    value: boolean
  ) => void;
  reset: () => void;
};

const clampScore = (v: number | null) => {
  if (v == null || Number.isNaN(v)) return null;
  const n = Math.max(1, Math.min(10, v));
  // Keep one decimal precision
  return Math.round(n * 10) / 10;
};

export const useFilmStore = create<FilmState>()(
  devtools(
    persist(
      (set) => ({
        current: null,
        lastVisitedFilmId: null,
        spoilersVisible: false,

        watchStatusByFilm: {},
        draftsByFilm: {},

        pending: {},

        setCurrent: (film) =>
          set(
            (s) => ({
              current: film,
              lastVisitedFilmId: film?.id ?? s.lastVisitedFilmId,
            }),
            false,
            "film/setCurrent"
          ),

        markVisited: (filmId) =>
          set({ lastVisitedFilmId: filmId }, false, "film/markVisited"),

        toggleSpoilers: (force) =>
          set(
            (s) => ({
              spoilersVisible:
                typeof force === "boolean" ? force : !s.spoilersVisible,
            }),
            false,
            "film/toggleSpoilers"
          ),

        setWatchStatus: (filmId, status) =>
          set(
            (s) => ({
              watchStatusByFilm: { ...s.watchStatusByFilm, [filmId]: status },
            }),
            false,
            "film/setWatchStatus"
          ),

        setScoreDraft: (filmId, score) =>
          set(
            (s) => {
              const d = s.draftsByFilm[filmId] ?? {
                score: null,
                review: "",
                updatedAt: Date.now(),
              };
              return {
                draftsByFilm: {
                  ...s.draftsByFilm,
                  [filmId]: {
                    ...d,
                    score: clampScore(score),
                    updatedAt: Date.now(),
                  },
                },
              };
            },
            false,
            "film/setScoreDraft"
          ),

        setReviewDraft: (filmId, review) =>
          set(
            (s) => {
              const d = s.draftsByFilm[filmId] ?? {
                score: null,
                review: "",
                updatedAt: Date.now(),
              };
              return {
                draftsByFilm: {
                  ...s.draftsByFilm,
                  [filmId]: { ...d, review, updatedAt: Date.now() },
                },
              };
            },
            false,
            "film/setReviewDraft"
          ),

        importExistingReview: (filmId, score, review) =>
          set(
            (s) => ({
              draftsByFilm: {
                ...s.draftsByFilm,
                [filmId]: {
                  score: clampScore(score),
                  review: review ?? "",
                  updatedAt: Date.now(),
                },
              },
            }),
            false,
            "film/importExistingReview"
          ),

        clearDrafts: (filmId) =>
          set(
            (s) => {
              const next = { ...s.draftsByFilm };
              delete next[filmId];
              return { draftsByFilm: next };
            },
            false,
            "film/clearDrafts"
          ),

        setPending: (type, filmId, value) =>
          set(
            (s) => ({
              pending: { ...s.pending, [`${type}:${filmId}`]: value },
            }),
            false,
            "film/setPending"
          ),

        reset: () =>
          set(
            {
              current: null,
              lastVisitedFilmId: null,
              spoilersVisible: false,
              watchStatusByFilm: {},
              draftsByFilm: {},
              pending: {},
            },
            false,
            "film/reset"
          ),
      }),
      {
        name: "eiga.film", // localStorage key
        storage: createJSONStorage(() => localStorage),
        // Only persist the user-meaningful bits
        partialize: (state) => ({
          lastVisitedFilmId: state.lastVisitedFilmId,
          spoilersVisible: state.spoilersVisible,
          watchStatusByFilm: state.watchStatusByFilm,
          draftsByFilm: state.draftsByFilm,
        }),
        version: 1,
      }
    ),
    { name: "film-store" }
  )
);

// Selectors for convenient, fine-grained subscriptions
export const filmSelectors = {
  current: (s: FilmState) => s.current,
  spoilersVisible: (s: FilmState) => s.spoilersVisible,
  watchStatusFor:
    (filmId: number) =>
    (s: FilmState): WatchStatus =>
      s.watchStatusByFilm[filmId] ?? "not_watched",
  draftFor:
    (filmId: number) =>
    (s: FilmState): FilmDrafts => {
      const d = s.draftsByFilm[filmId];
      return d ?? { score: null, review: "", updatedAt: 0 };
    },
  scoreDraftFor:
    (filmId: number) =>
    (s: FilmState): number | null =>
      s.draftsByFilm[filmId]?.score ?? null,
  reviewDraftFor:
    (filmId: number) =>
    (s: FilmState): string =>
      s.draftsByFilm[filmId]?.review ?? "",
  isPending:
    (type: "review" | "status", filmId: number) =>
    (s: FilmState): boolean =>
      !!s.pending[`${type}:${filmId}`],
};
