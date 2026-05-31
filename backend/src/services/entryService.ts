import { prisma } from '../config/database';
import { z } from 'zod';

export const createEntrySchema = z.object({
  licensePlate: z.string().min(1).max(20),
  vehiclePhoto: z.string(),
  driverPhoto: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;

interface EntryFilters {
  licensePlate?: string;
  startDate?: Date;
  endDate?: Date;
  guardId?: string;
  page?: number;
  limit?: number;
}

export class EntryService {
  async createEntry(input: CreateEntryInput, guardId: string) {
    const entry = await prisma.entry.create({
      data: {
        licensePlate: input.licensePlate,
        vehiclePhoto: input.vehiclePhoto,
        driverPhoto: input.driverPhoto,
        guardId,
        latitude: input.latitude,
        longitude: input.longitude,
        notes: input.notes,
      },
      include: {
        guard: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    return entry;
  }

  async getEntries(filters: EntryFilters = {}) {
    const { licensePlate, startDate, endDate, guardId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (licensePlate) {
      where.licensePlate = {
        contains: licensePlate,
        mode: 'insensitive',
      };
    }

    if (startDate || endDate) {
      where.entryTimestamp = {};
      if (startDate) where.entryTimestamp.gte = new Date(startDate);
      if (endDate) where.entryTimestamp.lte = new Date(endDate);
    }

    if (guardId) {
      where.guardId = guardId;
    }

    const [entries, total] = await prisma.$transaction([
      prisma.entry.findMany({
        where,
        include: {
          guard: {
            select: { id: true, username: true, fullName: true },
          },
          exits: {
            select: { id: true },
          },
        },
        orderBy: { entryTimestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.entry.count({ where }),
    ]);

    // Add hasExit flag
    const enrichedEntries = entries.map((entry) => ({
      ...entry,
      hasExit: entry.exits.length > 0,
    }));

    return {
      entries: enrichedEntries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEntryById(id: string) {
    return prisma.entry.findUnique({
      where: { id },
      include: {
        guard: {
          select: { id: true, username: true, fullName: true },
        },
        exits: {
          include: {
            guard: {
              select: { id: true, username: true, fullName: true },
            },
          },
        },
        incidents: true,
      },
    });
  }

  async getUnsettledEntries(licensePlate?: string) {
    const where: any = {
      exits: { none: {} },
    };

    if (licensePlate) {
      where.licensePlate = {
        contains: licensePlate,
        mode: 'insensitive',
      };
    }

    return prisma.entry.findMany({
      where,
      include: {
        guard: {
          select: { id: true, username: true, fullName: true },
        },
      },
      orderBy: { entryTimestamp: 'desc' },
    });
  }
}
