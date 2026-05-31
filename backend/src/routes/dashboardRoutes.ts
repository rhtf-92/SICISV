import { Router } from 'express';
import { getStats, getRecent } from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/stats', authenticate, authorize(['admin', 'support']), getStats);
router.get('/recent', authenticate, authorize(['admin', 'support']), getRecent);

export default router;
