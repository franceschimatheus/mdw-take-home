import { useMutation } from '@tanstack/react-query';

import { queryKeys } from '@/config/query-keys';
import { postWatchMovie } from '@/features/movies/api/watch-movie';

export function useWatchMovie() {
  return useMutation({
    mutationKey: queryKeys.movies.watch,
    mutationFn: postWatchMovie,
  });
}
