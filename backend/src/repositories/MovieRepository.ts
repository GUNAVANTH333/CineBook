import prisma from "../config/db.js";
import { Movie } from "../generated/prisma/client.js";

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
      const showIds = shows.map((s) => s.id);

      if (showIds.length > 0) {
        const bookings = await tx.booking.count({ where: { showId: { in: showIds } } });
        if (bookings > 0) return { blockedByBookings: true };

        await tx.showSeat.deleteMany({ where: { showId: { in: showIds } } });
        await tx.show.deleteMany({ where: { movieId: id } });
      }

      await tx.movie.delete({ where: { id } });
      return { blockedByBookings: false };
    });
  }
}

export const movieRepository = new MovieRepository();
