import { Router, Request, Response } from 'express';

const router = Router();
const FACIAL_SERVICE_URL = process.env.FACIAL_SERVICE_URL || 'http://localhost:3002';

router.post('/recognize', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${FACIAL_SERVICE_URL}/api/facial/recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(502).json({ success: false, error: 'Facial service unavailable' });
  }
});

router.post('/register-profile', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${FACIAL_SERVICE_URL}/api/facial/register-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(502).json({ success: false, error: 'Facial service unavailable' });
  }
});

export default router;
