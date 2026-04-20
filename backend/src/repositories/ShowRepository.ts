import prisma from "../config/db.js";
import { Show, ShowStatus } from "../generated/prisma/client.js";

export class ShowRepository {
  async findAll(filters: { movieId?: string; city?: string }): Promise<Show[]> {
    return prisma.show.findMany({
      where: {
        ...(filters.movieId ? { movieId: filters.movieId } : {}),
        ...(filters.city
          ? { screen: { multiplex: { city: filters.city } } }
          : {}),
        status: ShowStatus.SCHEDULED,
        showTime: { gte: new Date() },
      },
      include: {
        movie: true,
        screen: { include: { multiplex: true } },
      },
      orderBy: { showTime: "asc" },
    });
  }

  async findById(id: string): Promise<Show | null> {
    return prisma.show.findUnique({
      where: { id },
      include: {
        movie: true,
        screen: { include: { multiplex: true } },
      },
    });
  }

  async hasOverlap(
    screenId: string,
    showTime: Date,
    endTime: Date,
    excludeId?: string
  ): Promise<boolean> {
    const conflict = await prisma.show.findFirst({
      where: {
        screenId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { not: ShowStatus.CANCELLED },
        OR: [
          { showTime: { lt: endTime }, endTime: { gt: showTime } },
        ],
      },
    });
    return conflict !== null;
  }

  async create(data: {
    movieId: string;
    screenId: string;
    showTime: Date;
    endTime: Date;
    basePrice: number;
  }): Promise<Show> {
    return prisma.show.create({ data });
  }

  async updateStatus(id: string, status: ShowStatus): Promise<Show> {
    return prisma.show.update({ where: { id }, data: { status } });
  }

  async delete(id: string): Promise<{ blockedByBookings: boolean }> {
    return prisma.$transaction(async (tx) => {
      const bookings = await tx.booking.count({ where: { showId: id } });
      if (bookings > 0) return { blockedByBookings: true };

      await tx.showSeat.deleteMany({ where: { showId: id } });
      await tx.show.delete({ where: { id } });
      return { blockedByBookings: false };
    });
  }
}

export const showRepository = new ShowRepository();
