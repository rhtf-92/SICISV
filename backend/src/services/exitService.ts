import { prisma } from '../config/database';
import { z } from 'zod';
import { FacialClient } from './facialClient';

const facialClient = new FacialClient();

export const createExitSchema = z.object({
  licensePlate: z.string().min(1).max(20),
  driverPhotoExit: z.string().optional(),
  isDriverMatch: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
});

export type CreateExitInput = z.infer<typeof createExitSchema>;

interface ExitFilters {
  entryId?: string;
  licensePlate?: string;
  startDate?: Date;
  endDate?: Date;
  guardId?: string;
  page?: number;
  limit?: number;
}

export class ExitService {
  async createExit(input: CreateExitInput, guardId: string) {
    const entry = await prisma.entry.findFirst({
      where: {
        licensePlate: {
          equals: input.licensePlate,
          mode: 'insensitive',
        },
        exits: { none: {} },
      },
      orderBy: { entryTimestamp: 'desc' },
    });

    if (!entry) {
      throw new Error('No unsettled entry found for this license plate');
    }

    let isDriverMatch: boolean | null = input.isDriverMatch ?? null;

    if (input.driverPhotoExit && isDriverMatch === null) {
      try {
        const result = await facialClient.compareFace(entry.id, input.driverPhotoExit);
        if (result.success) {
          isDriverMatch = result.match ?? null;
        }
      } catch (err) {
        console.error(`Failed to compare faces for entry ${entry.id}:`, err);
      }
    }

    const exit = await prisma.exit.create({
      data: {
        entryId: entry.id,
        guardId,
        driverPhotoExit: input.driverPhotoExit,
        isDriverMatch,
        latitude: input.latitude,
        longitude: input.longitude,
        notes: input.notes,
      },
      include: {
        entry: {
          select: {
            id: true,
            licensePlate: true,
            entryTimestamp: true,
            vehiclePhoto: true,
            driverPhoto: true,
          },
        },
        guard: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    return exit;
  }

  async getExits(filters: ExitFilters = {}) {
    const { entryId, licensePlate, startDate, endDate, guardId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (entryId) where.entryId = entryId;

    if (licensePlate) {
      where.entry = {
        licensePlate: { contains: licensePlate, mode: 'insensitive' },
      };
    }

    if (startDate || endDate) {
      where.exitTimestamp = {};
      if (startDate) where.exitTimestamp.gte = new Date(startDate);
      if (endDate) where.exitTimestamp.lte = new Date(endDate);
    }

    if (guardId) where.guardId = guardId;

    const [exits, total] = await prisma.$transaction([
      prisma.exit.findMany({
        where,
        include: {
          entry: {
            select: {
              id: true,
              licensePlate: true,
              entryTimestamp: true,
              vehiclePhoto: true,
              driverPhoto: true,
            },
          },
          guard: {
            select: { id: true, username: true, fullName: true },
          },
        },
        orderBy: { exitTimestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.exit.count({ where }),
    ]);

    return {
      exits,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getExitById(id: string) {
    return prisma.exit.findUnique({
      where: { id },
      include: {
        entry: {
          include: {
            guard: {
              select: { id: true, username: true, fullName: true },
            },
          },
        },
        guard: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
  }
}
