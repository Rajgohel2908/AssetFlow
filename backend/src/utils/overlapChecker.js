// ─── Booking Overlap Checker ──────────────────────────────────────────────────
//
// BUSINESS RULE 5: Overlap check uses strict < / > so that back-to-back slots
// are ALLOWED. A booking ending at 10:00 and a booking starting at 10:00 do
// NOT overlap.
//
// Overlap condition:
//   existingStart < newEnd  AND  existingEnd > newStart
//
// This means:
//   [10:00 – 11:00] vs [11:00 – 12:00] → no overlap ✓ (back-to-back allowed)
//   [10:00 – 11:00] vs [10:30 – 12:00] → overlap ✗
//   [10:00 – 12:00] vs [09:00 – 10:30] → overlap ✗

import prisma from '../lib/prisma.js';

/**
 * Pure function — checks if two time ranges overlap.
 * Uses strict < / > so back-to-back is allowed.
 *
 * @param {Date} existingStart
 * @param {Date} existingEnd
 * @param {Date} newStart
 * @param {Date} newEnd
 * @returns {boolean} true if they overlap
 */
export const hasOverlap = (existingStart, existingEnd, newStart, newEnd) => {
  return existingStart < newEnd && existingEnd > newStart;
};

/**
 * Check if a booking for a given resource overlaps with existing confirmed bookings.
 * Optionally excludes a specific booking ID (for reschedule).
 *
 * @param {string}  resourceId
 * @param {Date}    startTime
 * @param {Date}    endTime
 * @param {string}  [excludeBookingId] - booking to exclude from check (for reschedule)
 * @returns {Promise<{conflict: boolean, booking: object|null}>}
 */
export const checkBookingOverlap = async (resourceId, startTime, endTime, excludeBookingId = null) => {
  const conflicting = await prisma.booking.findFirst({
    where: {
      resourceId,
      status: 'CONFIRMED',
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      // existingStart < newEnd AND existingEnd > newStart
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } },
      ],
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      resource: { select: { id: true, name: true } },
    },
  });

  return {
    conflict: !!conflicting,
    booking: conflicting,
  };
};
