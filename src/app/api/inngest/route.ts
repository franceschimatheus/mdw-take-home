import { serve } from 'inngest/next';

import { movieWatched } from '@/features/movies/handler/inngest';
import { inngest } from '@/lib/inngest/client';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [movieWatched],
});
