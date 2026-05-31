import { Response } from 'express';
import { prisma } from '../config/database';
import type { AuthenticatedRequest } from '../types';

export async function getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalEntries, totalExits, totalIncidents, unresolvedIncidents, entriesToday, exitsToday] =
      await Promise.all([
        prisma.entry.count(),
        prisma.exit.count(),
        prisma.incident.count(),
        prisma.incident.count({ where: { status: 'open' } }),
        prisma.entry.count({ where: { entryTimestamp: { gte: today } } }),
        prisma.exit.count({ where: { exitTimestamp: { gte: today } } }),
      ]);

    const pendingExits = await prisma.entry.count({
      where: { exits: { none: {} } },
    });

    res.status(200).json({
      success: true,
      data: {
        totalEntries,
        totalExits,
        totalIncidents,
        unresolvedIncidents,
        entriesToday,
        exitsToday,
        pendingExits,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getRecent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const [recentEntries, recentExits, recentIncidents] = await Promise.all([
      prisma.entry.findMany({
        take: limit,
        orderBy: { entryTimestamp: 'desc' },
        include: {
          guard: { select: { username: true, fullName: true } },
          exits: { select: { id: true } },
        },
      }),
      prisma.exit.findMany({
        take: limit,
        orderBy: { exitTimestamp: 'desc' },
        include: {
          entry: { select: { licensePlate: true, entryTimestamp: true } },
          guard: { select: { username: true, fullName: true } },
        },
      }),
      prisma.incident.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          entry: { select: { licensePlate: true, entryTimestamp: true } },
          reportedBy: { select: { username: true, fullName: true } },
        },
      }),
    ]);

    // Enrich entries with hasExit
    const enrichedEntries = recentEntries.map((entry) => ({
      ...entry,
      hasExit: entry.exits.length > 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        recentEntries: enrichedEntries,
        recentExits,
        recentIncidents,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
