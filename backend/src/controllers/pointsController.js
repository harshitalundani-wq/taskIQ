import mongoose from 'mongoose';
import User from '../models/User.js';
import { createNotification } from '../utils/notificationHelper.js';

// @desc    Award points to a user (Admin only)
// @route   POST /api/admin/users/:userId/points
// @access  Private (Admin only)
export const awardPointsAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { points, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const numPoints = Number(points);
    if (isNaN(numPoints) || numPoints <= 0) {
      return res.status(400).json({
        message: 'Points must be a positive number greater than 0',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.points = (user.points || 0) + numPoints;
    await user.save();

    // Create a notification for the user
    await createNotification({
      userId: user._id,
      title: '🎉 Points Awarded!',
      message: `You have received ${numPoints} points! ${reason ? `Reason: ${reason}` : ''}`.trim(),
      type: 'rewards',
    });

    res.status(200).json({
      message: 'Points awarded successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        points: user.points,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user points (Admin view)
// @route   GET /api/admin/users/:userId/points
// @access  Private (Admin only)
export const getUserPointsAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      userId: user._id,
      name: user.name,
      points: user.points || 0,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's points
// @route   GET /api/users/points
// @access  Private (User & Admin)
export const getUserPoints = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      points: user.points || 0,
    });
  } catch (error) {
    next(error);
  }
};
