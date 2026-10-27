import { z } from 'zod';

export const movieWatchedSchema = z.object({
  movie_title: z.string().trim().min(1, 'Enter a movie title').max(200, 'Title is too long'),
  recipient_email: z.email('Enter a valid email address'),
});

export type MovieWatchedType = z.infer<typeof movieWatchedSchema>;

export const movieSchema = z.object({
  title: z.string(),
  year: z.string(),
  plot: z.string(),
  poster: z.string(),
  runtime: z.string(),
  genre: z.string(),
  director: z.string(),
  imdbRating: z.string(),
});

export type MovieType = z.infer<typeof movieSchema>;
