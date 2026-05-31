import { prisma } from '../config/database';
import { z } from 'zod';

export const createIncidentSchema = z.object({
  entryId: z.string().uuid(),
  incidentType: z.enum([
    'driver_mismatch',
    'unregistered_exit',
    'plate_not_visible',
    'conductor_refused',
    'other',
  ]),
  description: z.string().optional(),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

interface IncidentFilters {
  status?: string;
  incidentType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class IncidentService {
  async createIncident(input: CreateIncidentInput, reportedById: string) {
    // Verify entry exists
    const entry = await prisma.entry.findUnique({
      where: { id: input.entryId },
    });

    if (!entry) {
      throw new Error('Entry not found');
    }

    const incident = await prisma.incident.create({
      data: {
        entryId: input.entryId,
        incidentType: input.incidentType,
        description: input.description,
        reportedById,
      },
      include: {
        entry: {
          select: { id: true, licensePlate: true, entryTimestamp: true },
        },
        reportedBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    return incident;
  }

  async getIncidents(filters: IncidentFilters = {}) {
    const { status, incidentType, startDate, endDate, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (incidentType) where.incidentType = incidentType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [incidents, total] = await prisma.$transaction([
      prisma.incident.findMany({
        where,
        include: {
          entry: {
            select: { id: true, licensePlate: true, entryTimestamp: true },
          },
          reportedBy: {
            select: { id: true, username: true, fullName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.incident.count({ where }),
    ]);

    return {
      incidents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateIncidentStatus(id: string, status: string, resolutionNotes?: string) {
    const data: any = { status };

    if (resolutionNotes !== undefined) {
      data.resolutionNotes = resolutionNotes;
    }

    if (status === 'resolved') {
      data.resolvedAt = new Date();
    }

    return prisma.incident.update({
      where: { id },
      data,
      include: {
        entry: {
          select: { id: true, licensePlate: true, entryTimestamp: true },
        },
        reportedBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
  }
}
