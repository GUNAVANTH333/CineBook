import { multiplexRepository } from "../repositories/MultiplexRepository.js";
import { seatRepository } from "../repositories/SeatRepository.js";
import { Multiplex, Screen } from "../generated/prisma/client.js";
import { NotFoundError, ConflictError } from "../utils/AppError.js";

interface CreateMultiplexDto {
  name: string;
  location: string;
  city: string;
  totalScreens: number;
}

interface AddScreenDto {
  screenNumber: number;
  totalRows: number;
  totalColumns: number;
  capacity: number;
}

export class MultiplexService {
  async getAll(): Promise<(Multiplex & { screens: Screen[] })[]> {
    return multiplexRepository.findAll();
  }

  async getById(id: string): Promise<Multiplex & { screens: Screen[] }> {
    const multiplex = await multiplexRepository.findById(id);
    if (!multiplex) throw new NotFoundError("Multiplex");
    return multiplex;
  }

  async create(dto: CreateMultiplexDto): Promise<Multiplex> {
    return multiplexRepository.create(dto);
  }

  async update(id: string, dto: Partial<CreateMultiplexDto>): Promise<Multiplex> {
    await this.getById(id);
    return multiplexRepository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    const { blockedByBookings } = await multiplexRepository.delete(id);
    if (blockedByBookings) {
      throw new ConflictError(
        "Cannot delete multiplex: there are existing bookings for its shows. Cancel those bookings first."
      );
    }
  }

  async addScreen(multiplexId: string, dto: AddScreenDto): Promise<Screen> {
    await this.getById(multiplexId);
    const screen = await multiplexRepository.addScreen({ multiplexId, ...dto });

    // Auto-generate Seat rows for this screen
    const { totalRows, totalColumns } = dto;
    const seats: Array<{
      rowLabel: string;
      seatNumber: number;
      seatType: "STANDARD" | "PREMIUM" | "RECLINER";
      priceMultiplier: number;
    }> = [];

    for (let r = 0; r < totalRows; r++) {
      // A=0, B=1, … Z=25, AA=26 …
      const rowLabel = String.fromCharCode(65 + r);

      // Last 2 rows → Recliner, middle 30% → Premium, rest → Standard
      let seatType: "STANDARD" | "PREMIUM" | "RECLINER";
      let priceMultiplier: number;

      if (r >= totalRows - 2) {
        seatType = "RECLINER";
        priceMultiplier = 2.0;
      } else if (r >= Math.floor(totalRows * 0.5) && r < totalRows - 2) {
        seatType = "PREMIUM";
        priceMultiplier = 1.5;
      } else {
        seatType = "STANDARD";
        priceMultiplier = 1.0;
      }

      for (let c = 1; c <= totalColumns; c++) {
        seats.push({ rowLabel, seatNumber: c, seatType, priceMultiplier });
      }
    }

    await seatRepository.createSeatsForScreen(screen.id, seats);

    return screen;
  }
}

export const multiplexService = new MultiplexService();
