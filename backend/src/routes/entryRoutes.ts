import { Router } from 'express';
import { createEntry, getEntries, getEntryById, getUnsettledEntries } from '../controllers/entryController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { createEntrySchema } from '../services/entryService';

const router = Router();

// IMPORTANT: /unsettled MUST come before /:id to avoid being captured as a param
router.get('/unsettled', authenticate, authorize(['admin', 'guard']), getUnsettledEntries);
router.post('/', authenticate, authorize(['admin', 'guard']), validate(createEntrySchema), createEntry);
router.get('/', authenticate, authorize(['admin', 'support']), getEntries);
router.get('/:id', authenticate, authorize(['admin', 'support']), getEntryById);

export default router;
