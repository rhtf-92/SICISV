import { Response } from 'express';
import { IncidentService, createIncidentSchema } from '../services/incidentService';
import type { AuthenticatedRequest } from '../types';

const incidentService = new IncidentService();

export async function createIncident(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const input = createIncidentSchema.parse(req.body);
    const reportedById = req.userId;

    if (!reportedById) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const incident = await incidentService.createIncident(input, reportedById);

    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

export async function getIncidents(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      incidentType: req.query.incidentType as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      page: req.query.page ? Math.max(1, parseInt(req.query.page as string) || 1) : undefined,
      limit: req.query.limit ? Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10)) : undefined,
    };

    const result = await incidentService.getIncidents(filters);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

export async function updateIncidentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!id) {
      res.status(400).json({ success: false, error: 'Incident ID is required' });
      return;
    }

    if (!status) {
      res.status(400).json({ success: false, error: 'Status is required' });
      return;
    }

    const incident = await incidentService.updateIncidentStatus(id as string, status, resolutionNotes);

    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
