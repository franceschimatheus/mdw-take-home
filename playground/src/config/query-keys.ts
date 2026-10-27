// Single place for React Query keys, so invalidation and devtools stay consistent.
export const queryKeys = {
  movies: {
    watch: ['movies', 'watch'],
  },
} as const;
