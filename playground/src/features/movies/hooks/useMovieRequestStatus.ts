import { useRealtime } from 'inngest/react';

import type { WatchMovieResponseType } from '@/features/movies/handler/http.contract';
import { movieRequestChannel, type MovieRequestStatusType } from '@/features/movies/realtime';

// Follows one queued request through the Inngest function and returns every
// status update published so far, in order. Returns null when there's nothing to
// follow (no request yet, or the server issued no token).
export function useMovieRequestStatus(request: WatchMovieResponseType | undefined): MovieRequestStatusType[] | null {
  const token = request?.realtimeToken ?? undefined;

  const { messages } = useRealtime({
    channel: request ? movieRequestChannel(request.eventId) : undefined,
    topics: ['status'],
    token,
    enabled: Boolean(request && token),
    // The failure update comes from onFailure, a separate run, so don't stop
    // listening when the main run ends.
    autoCloseOnTerminal: false,
    // Stay connected in background tabs: realtime has no replay, so stages
    // published while paused (e.g. while viewing the run in the Dev Server)
    // would be lost and the card would stay stuck on the last one it saw.
    pauseOnHidden: false,
  });

  if (!request || !token) return null;

  return messages.all.flatMap((message) =>
    message.kind === 'data' && message.topic === 'status' ? [message.data] : [],
  );
}
