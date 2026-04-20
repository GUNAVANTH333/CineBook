import { showRepository } from "../repositories/ShowRepository.js";
import { movieRepository } from "../repositories/MovieRepository.js";
import { multiplexRepository } from "../repositories/MultiplexRepository.js";
import { seatRepository } from "../repositories/SeatRepository.js";
import { Show } from "../generated/prisma/client.js";
import { NotFoundError, ConflictError } from "../utils/AppError.js";
import prisma from "../config/db.js";

interface CreateShowDto {
  movieId: string;
  screenId: string;
  showTime: string | Date;
  basePrice: number;
}

export class ShowService {
  async getAll(filters: { movieId?: string; city?: string }): Promise<Show[]> {
    return showRepository.findAll(filters);
  }

  async getById(id: string): Promise<Show> {
    const show = await showRepository.findById(id);
    if (!show) throw new NotFoundError("Show");
    return show;
  }

  async create(dto: CreateShowDto): Promise<Show> {
    const movie = await movieRepository.findById(dto.movieId);
    if (!movie) throw new NotFoundError("Movie");

    const showTime = new Date(dto.showTime);
    const endTime = new Date(
      showTime.getTime() + movie.durationMinutes * 60 * 1000
    );

    const hasOverlap = await showRepository.hasOverlap(
      dto.screenId,
      showTime,
      endTime
    );
    if (hasOverlap) {
      throw new ConflictError("Screen is already booked during this time slot");
    }

    const show = await showRepository.create({
      movieId: dto.movieId,
      screenId: dto.screenId,
      showTime,
      endTime,
      basePrice: dto.basePrice,
    });

    // Initialize show seats from screen seats
    const seats = await seatRepository.findByScreen(dto.screenId);
    if (seats.length > 0) {
      await seatRepository.initShowSeats(
        show.id,
        seats.map((s) => s.id)
      );
    }

    return show;
  }
  async delete(id: string): Promise<void> {
    await this.getById(id);
    const { blockedByBookings } = await showRepository.delete(id);
    if (blockedByBookings) {
      throw new ConflictError(
        "Cannot delete show: it has existing bookings. Cancel those bookings first."
      );
    }
  }

  async repairSeatMaps(): Promise<{ screensFixed: number; showsFixed: number }> {
    let screensFixed = 0;
    let showsFixed = 0;

    // 1. Find all screens that have zero seats
    const screens = await prisma.screen.findMany({
      where: { seats: { none: {} } },
    });

    for (const screen of screens) {
      const { totalRows, totalColumns } = screen;
      const seats: Array<{
        rowLabel: string;
        seatNumber: number;
        seatType: "STANDARD" | "PREMIUM" | "RECLINER";
        priceMultiplier: number;
      }> = [];

      for (let r = 0; r < totalRows; r++) {
        const rowLabel = String.fromCharCode(65 + r);
        let seatType: "STANDARD" | "PREMIUM" | "RECLINER";
        let priceMultiplier: number;

        if (r >= totalRows - 2) {
          seatType = "RECLINER"; priceMultiplier = 2.0;
        } else if (r >= Math.floor(totalRows * 0.5) && r < totalRows - 2) {
          seatType = "PREMIUM"; priceMultiplier = 1.5;
        } else {
          seatType = "STANDARD"; priceMultiplier = 1.0;
        }

        for (let c = 1; c <= totalColumns; c++) {
          seats.push({ rowLabel, seatNumber: c, seatType, priceMultiplier });
        }
      }

      await seatRepository.createSeatsForScreen(screen.id, seats);
      screensFixed++;
    }

    // 2. Find all shows that have zero ShowSeat rows
    const shows = await prisma.show.findMany({
      where: { showSeats: { none: {} } },
    });

    for (const show of shows) {
      const seats = await seatRepository.findByScreen(show.screenId);
      if (seats.length > 0) {
        await seatRepository.initShowSeats(show.id, seats.map((s) => s.id));
        showsFixed++;
      }
    }

    return { screensFixed, showsFixed };
  }
}

export const showService = new ShowService();
