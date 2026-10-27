import 'server-only';

import { getClientSubscriptionToken } from 'inngest/react';

import { devToolsEnabled } from '@/features/movies/dev/options';
import type { WatchMovieRequestType, WatchMovieResponseType } from '@/features/movies/handler/http.contract';
import { movieRequestChannel } from '@/features/movies/realtime';
import { inngest, movieWatchedEvent } from '@/lib/inngest/client';

// Shared by the HTTP route and the Server Action: publishes the event and issues
// a realtime token for it. Throws when the event can't be published.
export async function queueMovieRequest({ dev, ...input }: WatchMovieRequestType): Promise<WatchMovieResponseType> {
  // Fault injection is a local testing aid: drop it before it reaches the event anywhere else.
  const { ids } = await inngest.send(movieWatchedEvent.create(devToolsEnabled && dev ? { ...input, dev } : input));
  const eventId = ids[0];

  const realtimeToken = await getClientSubscriptionToken(inngest, {
    channel: movieRequestChannel(eventId),
    topics: ['status'],
  }).catch((err: unknown) => {
    // Live progress is a nice-to-have: the email still goes out without it.
    console.error('[watch-movie] failed to create realtime token', err);
    return null;
  });

  return { eventId, realtimeToken };
}
