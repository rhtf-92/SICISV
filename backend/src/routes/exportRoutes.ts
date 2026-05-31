import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/authMiddleware';
import type { AuthenticatedRequest } from '../types';

const router = Router();

const escapeCSV = (val: any): string => {
  if (val === null || val === undefined) return '""';
  const clean = val.toString().replace(/"/g, '""');
  return `"${clean}"`;
};

// Export entries as CSV
router.get('/entries', authenticate, authorize(['admin', 'support']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, licensePlate } = req.query;

    const where: any = {};

    if (licensePlate) {
      where.licensePlate = { contains: licensePlate as string, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.entryTimestamp = {};
      if (startDate) where.entryTimestamp.gte = new Date(startDate as string);
      if (endDate) where.entryTimestamp.lte = new Date(endDate as string);
    }

    const entries = await prisma.entry.findMany({
      where,
      include: {
        guard: { select: { fullName: true } },
        exits: { select: { exitTimestamp: true } },
      },
      orderBy: { entryTimestamp: 'desc' },
    });

    // Build CSV
    const header = 'ID,Placa,Fecha Ingreso,Vigilante,Tiene Salida,Notas\n';
    const rows = entries.map((e) =>
      [
        escapeCSV(e.id),
        escapeCSV(e.licensePlate),
        escapeCSV(e.entryTimestamp.toISOString()),
        escapeCSV(e.guard.fullName),
        escapeCSV(e.exits.length > 0 ? 'Sí' : 'No'),
        escapeCSV(e.notes),
      ].join(',')
    );

    const csv = header + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=entries.csv');
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8
  } catch (error) {
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

// Export exits as CSV
router.get('/exits', authenticate, authorize(['admin', 'support']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, licensePlate } = req.query;

    const where: any = {};

    if (licensePlate) {
      where.entry = { licensePlate: { contains: licensePlate as string, mode: 'insensitive' } };
    }

    if (startDate || endDate) {
      where.exitTimestamp = {};
      if (startDate) where.exitTimestamp.gte = new Date(startDate as string);
      if (endDate) where.exitTimestamp.lte = new Date(endDate as string);
    }

    const exits = await prisma.exit.findMany({
      where,
      include: {
        entry: { select: { licensePlate: true, entryTimestamp: true } },
        guard: { select: { fullName: true } },
      },
      orderBy: { exitTimestamp: 'desc' },
    });

    const header = 'ID,Placa,Fecha Ingreso,Fecha Salida,Vigilante,Conductor Coincide,Notas\n';
    const rows = exits.map((e) =>
      [
        escapeCSV(e.id),
        escapeCSV(e.entry.licensePlate),
        escapeCSV(e.entry.entryTimestamp.toISOString()),
        escapeCSV(e.exitTimestamp.toISOString()),
        escapeCSV(e.guard.fullName),
        escapeCSV(e.isDriverMatch === null ? 'N/A' : e.isDriverMatch ? 'Sí' : 'No'),
        escapeCSV(e.notes),
      ].join(',')
    );

    const csv = header + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=exits.csv');
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

export default router;
