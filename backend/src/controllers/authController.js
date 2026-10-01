import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import SignupOTP from '../models/SignupOTP.js';
import generateToken from '../utils/generateToken.js';
import { sendSignupOTPEmail } from '../utils/email.js';

// @desc    Send 6-digit OTP for signup verification
// @route   POST /api/auth/send-signup-otp
// @access  Public
export const sendSignupOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        message: 'Please provide a valid email address',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user is already registered
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        message: 'A user with this email is already registered',
      });
    }

    // Generate random secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash the OTP
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // OTP expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Send email via Nodemailer (Gmail SMTP)
    try {
      await sendSignupOTPEmail(normalizedEmail, otp);
    } catch (emailError) {
      return res.status(500).json({
        message: 'Failed to send OTP email',
      });
    }

    // Upsert the OTP record (resets verification if resending)
    await SignupOTP.findOneAndUpdate(
      { email: normalizedEmail },
      { otpHash, expiresAt, verified: false, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: 'OTP sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 6-digit OTP for signup
// @route   POST /api/auth/verify-signup-otp
// @access  Public
export const verifySignupOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Please provide both email and OTP',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpString = String(otp).trim();

    // Find OTP record
    const otpRecord = await SignupOTP.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      return res.status(400).json({
        message: 'No OTP request found for this email. Please request a new OTP.',
      });
    }

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      return res.status(400).json({
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Compare OTP hash
    const isMatch = await bcrypt.compare(otpString, otpRecord.otpHash);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid OTP. Please check the code and try again.',
      });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    res.status(200).json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user after OTP verification
// @route   POST /api/auth/signup
// @access  Public
export const signupUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, skills, interests, profilePhoto } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, email, phone, and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        message: 'A user with this email is already registered',
      });
    }

    // Verify that the email has successfully passed OTP verification
    const otpRecord = await SignupOTP.findOne({ email: normalizedEmail });
    if (!otpRecord || !otpRecord.verified) {
      return res.status(400).json({
        message: 'Email has not been verified with OTP. Please request and verify your OTP first.',
      });
    }

    // Force role to "user" to prevent elevation via signup
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      skills: Array.isArray(skills) ? skills : [],
      interests: Array.isArray(interests) ? interests : [],
      profilePhoto: profilePhoto || '',
      role: 'user',
      points: 0,
    });

    // Invalidate the OTP record so it cannot be used again
    await SignupOTP.deleteOne({ email: normalizedEmail });

    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate admin & get token
// @route   POST /api/auth/admin/login
// @access  Public (Admin only credentials)
export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied: You do not have admin privileges',
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Admin login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private (Authenticated users)
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
