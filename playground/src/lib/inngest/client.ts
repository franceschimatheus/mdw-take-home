import { eventType, Inngest } from 'inngest';

import { devOptionsSchema } from '@/features/movies/dev/options';
import { movieWatchedSchema } from '@/features/movies/domain/movie';

export const inngest = new Inngest({ id: 'meadow-api' });

export const movieWatchedEvent = eventType('meadow_api/movie.watched', {
  schema: movieWatchedSchema.extend({ dev: devOptionsSchema.optional() }),
});
