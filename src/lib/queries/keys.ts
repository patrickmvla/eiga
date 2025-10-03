// lib/queries/keys.ts
export const qk = {
  film: {
    base: (id: number) => ['film', id] as const,
    ratings: (id: number) => ['film', id, 'ratings'] as const,
    discussion: (id: number) => ['film', id, 'discussion'] as const,
  },
  profile: (username: string) => ['profile', username] as const,
  suggestions: (userId: string) => ['suggestions', userId] as const,
  archive: (params: string) => ['archive', params] as const, // stringify filters if needed
};