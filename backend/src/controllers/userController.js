import mongoose from 'mongoose';
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';

// @desc    Get current user's profile with assignment details
// @route   GET /api/users/profile
// @access  Private (User & Admin)
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch assignments for this user if available
    const assignments = await Assignment.find({ userId: req.user._id })
      .populate('eventId', 'name description date startTime endTime location status')
      .populate('zoneId', 'name description capacity')
      .populate('taskId', 'name description startTime endTime status');

    res.status(200).json({
      user: {
        ...user.toJSON(),
        assignments: assignments || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user's profile
// @route   PUT /api/users/profile
// @access  Private (User & Admin)
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, skills, interests, profilePhoto } = req.body;

    // Validate and update name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      user.name = name.trim();
    }

    // Validate and update phone
    if (phone !== undefined) {
      if (typeof phone !== 'string' || phone.trim() === '') {
        return res.status(400).json({ message: 'Phone number cannot be empty' });
      }
      user.phone = phone.trim();
    }

    // Validate and update skills
    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({ message: 'Skills must be an array of strings' });
      }
      user.skills = skills.filter((s) => typeof s === 'string').map((s) => s.trim()).filter(Boolean);
    }

    // Validate and update interests
    if (interests !== undefined) {
      if (!Array.isArray(interests)) {
        return res.status(400).json({ message: 'Interests must be an array of strings' });
      }
      user.interests = interests.filter((i) => typeof i === 'string').map((i) => i.trim()).filter(Boolean);
    }

    // Update profile photo
    if (profilePhoto !== undefined) {
      user.profilePhoto = typeof profilePhoto === 'string' ? profilePhoto.trim() : '';
    }

    // Explicitly prevent modification of email, role, points, password, assignments
    const updatedUser = await user.save();

    const assignments = await Assignment.find({ userId: updatedUser._id })
      .populate('eventId', 'name description date startTime endTime location status')
      .populate('zoneId', 'name description capacity')
      .populate('taskId', 'name description startTime endTime status');

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        ...updatedUser.toJSON(),
        assignments: assignments || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with assignments (Admin only)
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    const userIds = users.map((u) => u._id);
    const allAssignments = await Assignment.find({ userId: { $in: userIds } })
      .populate('eventId', 'name date location status')
      .populate('zoneId', 'name')
      .populate('taskId', 'name status');

    const usersWithAssignments = users.map((user) => {
      const userAssignments = allAssignments.filter(
        (a) => a.userId && a.userId.toString() === user._id.toString()
      );
      return {
        ...user.toJSON(),
        assignments: userAssignments,
      };
    });

    res.status(200).json({
      count: usersWithAssignments.length,
      users: usersWithAssignments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific user profile by ID with assignment details (Admin only)
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const assignments = await Assignment.find({ userId: id })
      .populate('eventId', 'name description date startTime endTime location status')
      .populate('zoneId', 'name description capacity')
      .populate('taskId', 'name description startTime endTime status');

    res.status(200).json({
      user: {
        ...user.toJSON(),
        assignments: assignments || [],
      },
    });
  } catch (error) {
    next(error);
  }
};
