import express from 'express';
import {
  sendSignupOTP,
  verifySignupOTP,
  signupUser,
  loginUser,
  loginAdmin,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send-signup-otp', sendSignupOTP);
router.post('/verify-signup-otp', verifySignupOTP);
router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/admin/login', loginAdmin);
router.get('/me', protect, getMe);

export default router;
