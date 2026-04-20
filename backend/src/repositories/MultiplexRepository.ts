import prisma from "../config/db.js";
import { Multiplex, Screen } from "../generated/prisma/client.js";

export class MultiplexRepository {
  async findAll(): Promise<(Multiplex & { screens: Screen[] })[]> {
    return prisma.multiplex.findMany({
      include: { screens: true },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string): Promise<(Multiplex & { screens: Screen[] }) | null> {
    return prisma.multiplex.findUnique({
      where: { id },
      include: { screens: true },
    });
  }

  async create(data: {
    name: string;
    location: string;
    city: string;
    totalScreens: number;
  }): Promise<Multiplex> {
    return prisma.multiplex.create({ data });
  }

  async update(id: string, data: Partial<{
    name: string;
    location: string;
    city: string;
    totalScreens: number;
  }>): Promise<Multiplex> {
    return prisma.multiplex.update({ where: { id }, data });
  }

  async delete(id: string): Promise<{ blockedByBookings: boolean }> {
    return prisma.$transaction(async (tx) => {
      const screens = await tx.screen.findMany({ where: { multiplexId: id }, select: { id: true } });
      const screenIds = screens.map((s) => s.id);

      if (screenIds.length > 0) {
        const shows = await tx.show.findMany({ where: { screenId: { in: screenIds } }, select: { id: true } });
        const showIds = shows.map((s) => s.id);

        if (showIds.length > 0) {
          const bookings = await tx.booking.count({ where: { showId: { in: showIds } } });
          if (bookings > 0) return { blockedByBookings: true };

          await tx.showSeat.deleteMany({ where: { showId: { in: showIds } } });
          await tx.show.deleteMany({ where: { id: { in: showIds } } });
        }

        await tx.seat.deleteMany({ where: { screenId: { in: screenIds } } });
        await tx.screen.deleteMany({ where: { multiplexId: id } });
      }

      await tx.multiplex.delete({ where: { id } });
      return { blockedByBookings: false };
    });
  }

  async addScreen(data: {
    multiplexId: string;
    screenNumber: number;
    totalRows: number;
    totalColumns: number;
    capacity: number;
  }): Promise<Screen> {
    return prisma.screen.create({ data });
  }
}

export const multiplexRepository = new MultiplexRepository();
