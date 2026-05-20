import prisma from "../config/db.js";
import { Movie } from "../generated/prisma/client.js";
import { purgeShows } from "./cascade.js";

export class MovieRepository {
  async findAll(): Promise<Movie[]> {
    return prisma.movie.findMany({ orderBy: { releaseDate: "desc" } });
  }

  async findById(id: string): Promise<Movie | null> {
    return prisma.movie.findUnique({ where: { id } });
  }

  async create(data: {
    title: string;
    genre: string;
    durationMinutes: number;
    language: string;
    rating: string;
    posterUrl: string;
    releaseDate: Date;
  }): Promise<Movie> {
    return prisma.movie.create({ data });
  }

  async update(id: string, data: Partial<{
    title: string;
    genre: string;
    durationMinutes: number;
    language: string;
    rating: string;
    posterUrl: string;
    releaseDate: Date;
  }>): Promise<Movie> {
    return prisma.movie.update({ where: { id }, data });
  }

  async delete(id: string): Promise<{ blockedByBookings: boolean }> {
    return prisma.$transaction(async (tx) => {
      const shows = await tx.show.findMany({ where: { movieId: id }, select: { id: true } });
      const result = await purgeShows(tx, shows.map((s) => s.id));
      if (result.blockedByBookings) return result;

      await tx.movie.delete({ where: { id } });
      return { blockedByBookings: false };
    });
  }
}

export const movieRepository = new MovieRepository();
