import { Prisma, BookingStatus } from "../generated/prisma/client.js";

// Removes the given shows together with their seat maps and any non-active
// bookings (cancelled or abandoned checkouts) in foreign-key-safe order.
// A confirmed booking blocks the deletion and leaves everything untouched.
export async function purgeShows(
  tx: Prisma.TransactionClient,
  showIds: string[]
): Promise<{ blockedByBookings: boolean }> {
  if (showIds.length === 0) return { blockedByBookings: false };

  const confirmed = await tx.booking.count({
    where: { showId: { in: showIds }, status: BookingStatus.CONFIRMED },
  });
  if (confirmed > 0) return { blockedByBookings: true };

  const bookings = await tx.booking.findMany({
    where: { showId: { in: showIds } },
    select: { id: true },
  });
  const bookingIds = bookings.map((b) => b.id);

  if (bookingIds.length > 0) {
    await tx.bookingLog.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await tx.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await tx.bookingSeat.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await tx.booking.deleteMany({ where: { id: { in: bookingIds } } });
  }

  await tx.showSeat.deleteMany({ where: { showId: { in: showIds } } });
  await tx.show.deleteMany({ where: { id: { in: showIds } } });

  return { blockedByBookings: false };
}
