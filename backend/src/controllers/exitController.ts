import { Response } from 'express';
import { ExitService, createExitSchema } from '../services/exitService';
import type { AuthenticatedRequest } from '../types';

const exitService = new ExitService();

export async function createExit(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const input = createExitSchema.parse(req.body);
    const guardId = req.userId;

    if (!guardId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const exit = await exitService.createExit(input, guardId);

    res.status(201).json({
      success: true,
      data: {
        id: exit.id,
        entryId: exit.entryId,
        exitTimestamp: exit.exitTimestamp,
        driverMatch: exit.isDriverMatch,
        entry: exit.entry,
        message: 'Exit registered successfully',
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

export async function getExits(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const filters = {
      entryId: req.query.entryId as string | undefined,
      licensePlate: req.query.licensePlate as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      guardId: req.query.guardId as string | undefined,
      page: req.query.page ? Math.max(1, parseInt(req.query.page as string) || 1) : undefined,
      limit: req.query.limit ? Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10)) : undefined,
    };

    const result = await exitService.getExits(filters);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

export async function getExitById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, error: 'Exit ID is required' });
      return;
    }

    const exit = await exitService.getExitById(id as string);

    if (!exit) {
      res.status(404).json({ success: false, error: 'Exit not found' });
      return;
    }

    res.status(200).json({ success: true, data: exit });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
