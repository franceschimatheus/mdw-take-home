import { describe, expect, it } from 'vitest';

import { buildPlotEmailContent } from '@/features/movies/domain/rules';
import { matrix } from '@/features/movies/testing/fixtures';

describe('buildPlotEmailContent', () => {
  it('builds the email content from a complete movie', () => {
    expect(buildPlotEmailContent(matrix)).toEqual({
      subject: 'Plot summary: The Matrix (1999)',
      title: 'The Matrix',
      posterUrl: 'https://m.media-amazon.com/images/M/matrix.jpg',
      details: ['1999', '136 min', 'Action, Sci-Fi'],
      rating: '8.7',
      director: 'Lana Wachowski, Lilly Wachowski',
      plot: matrix.plot,
    });
  });

  it('leaves out every N/A field', () => {
    const content = buildPlotEmailContent({
      ...matrix,
      year: 'N/A',
      poster: 'N/A',
      runtime: 'N/A',
      genre: 'N/A',
      director: 'N/A',
      imdbRating: 'N/A',
    });

    expect(content).toMatchObject({ subject: 'Plot summary: The Matrix', details: [] });
    expect(content.posterUrl).toBeUndefined();
    expect(content.rating).toBeUndefined();
    expect(content.director).toBeUndefined();
  });

  it('falls back to a default message when the plot is N/A', () => {
    expect(buildPlotEmailContent({ ...matrix, plot: 'N/A' }).plot).toBe('No plot summary is available for this movie.');
  });

  it('ignores non-HTTPS posters', () => {
    expect(buildPlotEmailContent({ ...matrix, poster: 'http://example.com/p.jpg' }).posterUrl).toBeUndefined();
  });
});
