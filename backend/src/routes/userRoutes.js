import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
} from '../controllers/userController.js';
import { getUserAssignments } from '../controllers/assignmentController.js';
import {
  getUserAttendance,
  userCheckIn,
  userCheckOut,
} from '../controllers/attendanceController.js';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import {
  reportEmergency,
  getUserEmergencies,
} from '../controllers/emergencyController.js';
import { getUserPoints } from '../controllers/pointsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All user routes require authentication
router.use(protect);

// 1. User Profile
router.route('/profile').get(getUserProfile).put(updateUserProfile);

// 2. User Assignments
router.get('/assignments', getUserAssignments);

// 3. User Attendance
router.get('/attendance', getUserAttendance);
router.post('/attendance/check-in', userCheckIn);
router.post('/attendance/check-out', userCheckOut);

// 4. User Notifications
router.get('/notifications', getUserNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);
router.delete('/notifications/:id', deleteNotification);

// 5. User Emergency Reporting
router.route('/emergency').post(reportEmergency).get(getUserEmergencies);

// 6. User Rewards / Points
router.get('/points', getUserPoints);

export default router;
