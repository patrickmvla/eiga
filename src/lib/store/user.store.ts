// lib/stores/user.store.ts
"use client";

import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

export type Role = "admin" | "member";

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  role: Role;
  avatar_url?: string | null;
  name?: string | null;
  is_active?: boolean;
};

export type Preferences = {
  textSize: "sm" | "md" | "lg"; // reading size for reviews/discussion
  density: "comfortable" | "compact"; // UI spacing
  reduceMotion: boolean; // prefer reduced motion
  spoilerDefaultVisible: boolean; // default spoiler visibility
  email: {
    newFilm: boolean;
    replies: boolean;
    weeklySummary: boolean;
  };
};

type UserState = {
  // Session (client cache only; authoritative source is server)
  session: SessionUser | null;

  // Local preferences (persisted)
  preferences: Preferences;

  // Actions
  setSession: (user: SessionUser | null) => void;
  updateProfile: (
    patch: Partial<Pick<SessionUser, "username" | "name" | "avatar_url">>
  ) => void;

  setPreferences: (patch: Partial<Preferences>) => void;
  setEmailPrefs: (patch: Partial<Preferences["email"]>) => void;
  setTextSize: (size: Preferences["textSize"]) => void;
  setDensity: (density: Preferences["density"]) => void;
  setReduceMotion: (val: boolean) => void;
  setSpoilerDefaultVisible: (val: boolean) => void;

  clearSession: () => void;
  resetPreferences: () => void;
  resetAll: () => void;
};

const defaultPreferences: Preferences = {
  textSize: "md",
  density: "comfortable",
  reduceMotion: false,
  spoilerDefaultVisible: false,
  email: {
    newFilm: true,
    replies: true,
    weeklySummary: true,
  },
};

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        session: null,
        preferences: defaultPreferences,

        setSession: (user) => set({ session: user }, false, "user/setSession"),

        updateProfile: (patch) =>
          set(
            (s) => (s.session ? { session: { ...s.session, ...patch } } : {}),
            false,
            "user/updateProfile"
          ),

        setPreferences: (patch) =>
          set(
            (s) => ({ preferences: { ...s.preferences, ...patch } }),
            false,
            "user/setPreferences"
          ),

        setEmailPrefs: (patch) =>
          set(
            (s) => ({
              preferences: {
                ...s.preferences,
                email: { ...s.preferences.email, ...patch },
              },
            }),
            false,
            "user/setEmailPrefs"
          ),

        setTextSize: (size) =>
          set(
            (s) => ({ preferences: { ...s.preferences, textSize: size } }),
            false,
            "user/setTextSize"
          ),

        setDensity: (density) =>
          set(
            (s) => ({ preferences: { ...s.preferences, density } }),
            false,
            "user/setDensity"
          ),

        setReduceMotion: (val) =>
          set(
            (s) => ({ preferences: { ...s.preferences, reduceMotion: val } }),
            false,
            "user/setReduceMotion"
          ),

        setSpoilerDefaultVisible: (val) =>
          set(
            (s) => ({
              preferences: { ...s.preferences, spoilerDefaultVisible: val },
            }),
            false,
            "user/setSpoilerDefaultVisible"
          ),

        clearSession: () => set({ session: null }, false, "user/clearSession"),

        resetPreferences: () =>
          set(
            { preferences: defaultPreferences },
            false,
            "user/resetPreferences"
          ),

        resetAll: () =>
          set(
            { session: null, preferences: defaultPreferences },
            false,
            "user/resetAll"
          ),
      }),
      {
        name: "eiga.user", // localStorage key
        storage: createJSONStorage(() => localStorage),
        // Persist only preferences; session comes from server auth
        partialize: (state) => ({ preferences: state.preferences }),
        version: 1,
      }
    ),
    { name: "user-store" }
  )
);

// Convenient selectors for fine-grained subscriptions
export const userSelectors = {
  session: (s: UserState) => s.session,
  isLoggedIn: (s: UserState) => !!s.session,
  isAdmin: (s: UserState) => s.session?.role === "admin",
  displayName: (s: UserState) =>
    s.session?.name || s.session?.username || "Member",

  preferences: (s: UserState) => s.preferences,
  textSize: (s: UserState) => s.preferences.textSize,
  density: (s: UserState) => s.preferences.density,
  reduceMotion: (s: UserState) => s.preferences.reduceMotion,
  spoilerDefaultVisible: (s: UserState) => s.preferences.spoilerDefaultVisible,
  emailPrefs: (s: UserState) => s.preferences.email,
};
