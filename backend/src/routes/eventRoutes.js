import express from 'express';
import {
  getEventsForUser,
  getEventByIdForUser,
} from '../controllers/eventController.js';
import { getZonesByEventForUser } from '../controllers/zoneController.js';
import { getTasksByEventForUser } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all event routes
router.use(protect);

router.get('/', getEventsForUser);
router.get('/:id', getEventByIdForUser);
router.get('/:eventId/zones', getZonesByEventForUser);
router.get('/:eventId/tasks', getTasksByEventForUser);

export default router;
