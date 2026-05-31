import { Router } from 'express';
import { createExit, getExits, getExitById } from '../controllers/exitController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { createExitSchema } from '../services/exitService';

const router = Router();

router.post('/', authenticate, authorize(['admin', 'guard']), validate(createExitSchema), createExit);
router.get('/', authenticate, authorize(['admin', 'support']), getExits);
router.get('/:id', authenticate, authorize(['admin', 'support']), getExitById);

export default router;
