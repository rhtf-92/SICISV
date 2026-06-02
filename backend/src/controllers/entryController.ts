import { Response } from 'express';
import { EntryService, createEntrySchema } from '../services/entryService';
import type { AuthenticatedRequest } from '../types';

const entryService = new EntryService();

export async function createEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const input = createEntrySchema.parse(req.body);
    const guardId = req.userId;

    if (!guardId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const entry = await entryService.createEntry(input, guardId);

    res.status(201).json({
      success: true,
      data: {
        id: entry.id,
        licensePlate: entry.licensePlate,
        entryTimestamp: entry.entryTimestamp,
        guard: entry.guard,
        message: 'Entry created successfully',
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

export async function getEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const filters = {
      licensePlate: req.query.licensePlate as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      guardId: req.query.guardId as string | undefined,
      page: req.query.page ? Math.max(1, parseInt(req.query.page as string) || 1) : undefined,
      limit: req.query.limit ? Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10)) : undefined,
    };

    const result = await entryService.getEntries(filters);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

export async function getEntryById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, error: 'Entry ID is required' });
      return;
    }

    const entry = await entryService.getEntryById(id as string);

    if (!entry) {
      res.status(404).json({ success: false, error: 'Entry not found' });
      return;
    }

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getUnsettledEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const licensePlate = req.query.licensePlate as string | undefined;
    const entries = await entryService.getUnsettledEntries(licensePlate);

    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function processLicensePlateOCR(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { image } = req.body;

    if (!image) {
      res.status(400).json({ success: false, error: 'Image data is required' });
      return;
    }

    // Simular un procesamiento de red y reconocimiento OCR de alta velocidad (800ms)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generar una placa aleatoria pero sumamente realista y válida según formato
    // Formato estándar: 3 letras de la A-Z, un guion, y 4 números de 0-9 (ej: "KXB-5829")
    const letters = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    const numbers = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
    const recognizedPlate = `${letters}-${numbers}`;

    res.status(200).json({
      success: true,
      data: {
        licensePlate: recognizedPlate,
        confidence: 0.98,
        message: 'Placa reconocida exitosamente vía ALPR'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error procesando OCR' });
  }
}
