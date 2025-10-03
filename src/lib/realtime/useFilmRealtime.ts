"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { joinFilmChannel } from "@/lib/realtime/client";
import { qk } from "@/lib/queries/keys";

export const useFilmRealtime = (filmId: number, presenceKey: string) => {
  const qc = useQueryClient();

  useEffect(() => {
    const { subscribe, leave } = joinFilmChannel(filmId, {
      presenceKey,
      on: {
        "discussion:new": () =>
          qc.invalidateQueries({ queryKey: qk.film.discussion(filmId) }),
        "discussion:update": () =>
          qc.invalidateQueries({ queryKey: qk.film.discussion(filmId) }),
        "reaction:new": () =>
          qc.invalidateQueries({ queryKey: qk.film.discussion(filmId) }),
        "reaction:remove": () =>
          qc.invalidateQueries({ queryKey: qk.film.discussion(filmId) }),
        "rating:new": () =>
          qc.invalidateQueries({ queryKey: qk.film.ratings(filmId) }),
        "rating:update": () =>
          qc.invalidateQueries({ queryKey: qk.film.ratings(filmId) }),
        "highlight:update": () =>
          qc.invalidateQueries({ queryKey: qk.film.discussion(filmId) }),
      },
    });

    subscribe().catch(() => {});
    return () => {
      void leave();
    };
  }, [filmId, presenceKey, qc]);
};
