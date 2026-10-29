import type { MovieType } from '@/features/movies/domain/movie';

export type PlotEmailContentType = {
  subject: string;
  title: string;
  posterUrl?: string;
  details: string[];
  rating?: string;
  director?: string;
  plot: string;
};

// OMDb's placeholder for missing values.
const NOT_AVAILABLE = 'N/A';

function available(value: string): string | undefined {
  return value === NOT_AVAILABLE || value.trim() === '' ? undefined : value;
}

export function buildPlotEmailContent(movie: MovieType): PlotEmailContentType {
  const year = available(movie.year);
  const poster = available(movie.poster);

  return {
    subject: `Plot summary: ${year ? `${movie.title} (${year})` : movie.title}`,
    title: movie.title,
    posterUrl: poster?.startsWith('https://') ? poster : undefined,
    details: [year, available(movie.runtime), available(movie.genre)].filter((value) => value !== undefined),
    rating: available(movie.imdbRating),
    director: available(movie.director),
    plot: available(movie.plot) ?? 'No plot summary is available for this movie.',
  };
}
