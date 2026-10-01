import express from 'express';
import {
  getAllUsers,
  getUserById,
} from '../controllers/userController.js';
import {
  createEvent,
  getAllEventsAdmin,
  getEventByIdAdmin,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';
import {
  createZone,
  getZonesByEventAdmin,
  getZoneByIdAdmin,
  updateZone,
  deleteZone,
} from '../controllers/zoneController.js';
import {
  createTask,
  getTasksByEventAdmin,
  getTaskByIdAdmin,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import {
  createAssignment,
  getAllAssignmentsAdmin,
  getAssignmentByIdAdmin,
  updateAssignment,
  deleteAssignment,
} from '../controllers/assignmentController.js';
import {
  recordAttendanceAdmin,
  getAllAttendanceAdmin,
  getAttendanceByIdAdmin,
  updateAttendanceAdmin,
  deleteAttendanceAdmin,
} from '../controllers/attendanceController.js';
import {
  getAllNotificationsAdmin,
  sendNotificationAdmin,
} from '../controllers/notificationController.js';
import {
  getAllEmergenciesAdmin,
  getEmergencyByIdAdmin,
  updateEmergencyStatusAdmin,
} from '../controllers/emergencyController.js';
import {
  awardPointsAdmin,
  getUserPointsAdmin,
} from '../controllers/pointsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect and adminOnly middleware to all routes in this router
router.use(protect, adminOnly);

// ==========================================
// 1. User Management (Admin)
// ==========================================
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);

// ==========================================
// 2. Event Management (Admin)
// ==========================================
router.post('/events', createEvent);
router.get('/events', getAllEventsAdmin);
router.get('/events/:id', getEventByIdAdmin);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);

// ==========================================
// 3. Zone Management (Admin)
// ==========================================
router.post('/events/:eventId/zones', createZone);
router.get('/events/:eventId/zones', getZonesByEventAdmin);
router.get('/zones/:id', getZoneByIdAdmin);
router.put('/zones/:id', updateZone);
router.delete('/zones/:id', deleteZone);

// ==========================================
// 4. Task Management (Admin)
// ==========================================
router.post('/events/:eventId/tasks', createTask);
router.get('/events/:eventId/tasks', getTasksByEventAdmin);
router.get('/tasks/:id', getTaskByIdAdmin);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// ==========================================
// 5. Assignment Management (Admin Controlled)
// ==========================================
router.post('/assignments', createAssignment);
router.get('/assignments', getAllAssignmentsAdmin);
router.get('/assignments/:id', getAssignmentByIdAdmin);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);

// ==========================================
// 6. Attendance Management (Admin)
// ==========================================
router.post('/attendance', recordAttendanceAdmin);
router.get('/attendance', getAllAttendanceAdmin);
router.get('/attendance/:id', getAttendanceByIdAdmin);
router.put('/attendance/:id', updateAttendanceAdmin);
router.delete('/attendance/:id', deleteAttendanceAdmin);

// ==========================================
// 7. Notifications Management (Admin)
// ==========================================
router.get('/notifications', getAllNotificationsAdmin);
router.post('/notifications', sendNotificationAdmin);

// ==========================================
// 8. Emergency Management (Admin)
// ==========================================
router.get('/emergencies', getAllEmergenciesAdmin);
router.get('/emergencies/:id', getEmergencyByIdAdmin);
router.patch('/emergencies/:id/status', updateEmergencyStatusAdmin);
router.put('/emergencies/:id', updateEmergencyStatusAdmin);

// ==========================================
// 9. Rewards & Points Management (Admin)
// ==========================================
router.post('/users/:userId/points', awardPointsAdmin);
router.get('/users/:userId/points', getUserPointsAdmin);

export default router;
