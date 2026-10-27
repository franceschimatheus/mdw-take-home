import { useMutation } from '@tanstack/react-query';

import { postWatchMovie } from '@/features/movies/api/watch-movie';

export function useWatchMovie() {
  return useMutation({ mutationFn: postWatchMovie });
}
