import { Router } from 'express';
import { createIncident, getIncidents, updateIncidentStatus } from '../controllers/incidentController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { createIncidentSchema } from '../services/incidentService';

const router = Router();

router.post('/', authenticate, authorize(['admin', 'guard']), validate(createIncidentSchema), createIncident);
router.get('/', authenticate, authorize(['admin', 'support']), getIncidents);
router.patch('/:id', authenticate, authorize(['admin', 'support']), updateIncidentStatus);

export default router;
