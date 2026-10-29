import type { MovieType } from '@/features/movies/domain/movie';
import { buildPlotEmailContent } from '@/features/movies/domain/rules';
import { renderPlotEmail } from '@/features/movies/emails/PlotEmail';

export type MovieServiceDepsType = {
  findMovieByTitle: (title: string) => Promise<MovieType>;
  sendEmail: (email: {
    to: string;
    subject: string;
    html: string;
    text: string;
    idempotencyKey: string;
  }) => Promise<{ id: string }>;
};

export function createMovieService({ findMovieByTitle, sendEmail }: MovieServiceDepsType) {
  return {
    findMovie(title: string): Promise<MovieType> {
      return findMovieByTitle(title.trim());
    },

    async sendPlotEmail(movie: MovieType, to: string, idempotencyKey: string): Promise<{ id: string }> {
      const email = await renderPlotEmail(buildPlotEmailContent(movie));
      return sendEmail({ to, idempotencyKey, ...email });
    },
  };
}
