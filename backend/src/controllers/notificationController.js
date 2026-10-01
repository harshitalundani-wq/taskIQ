import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Get current user's notifications
// @route   GET /api/users/notifications
// @access  Private (User & Admin)
export const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('relatedEvent', 'name date location status')
      .populate('relatedAssignment', 'assignedTimeSlot status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/users/notifications/:id/read
// @access  Private (User & Admin)
export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification ID format' });
    }

    const notification = await Notification.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read for current user
// @route   PATCH /api/users/notifications/read-all
// @access  Private (User & Admin)
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/users/notifications/:id
// @access  Private (User & Admin)
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification ID format' });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all notifications (Admin only)
// @route   GET /api/admin/notifications
// @access  Private (Admin only)
export const getAllNotificationsAdmin = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.type) filter.type = req.query.type;

    const notifications = await Notification.find(filter)
      .populate('userId', 'name email role')
      .populate('relatedEvent', 'name date location')
      .populate('relatedAssignment', 'assignedTimeSlot status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin send notification to specific user
// @route   POST /api/admin/notifications
// @access  Private (Admin only)
export const sendNotificationAdmin = async (req, res, next) => {
  try {
    const { userId, title, message, type, relatedEvent, relatedAssignment } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        message: 'Please provide userId, title, and message',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Target user does not exist' });
    }

    const notification = await Notification.create({
      userId,
      title: title.trim(),
      message: message.trim(),
      type: type || 'general',
      relatedEvent: relatedEvent && mongoose.Types.ObjectId.isValid(relatedEvent) ? relatedEvent : undefined,
      relatedAssignment: relatedAssignment && mongoose.Types.ObjectId.isValid(relatedAssignment) ? relatedAssignment : undefined,
    });

    const populated = await Notification.findById(notification._id).populate('userId', 'name email role');

    res.status(201).json({
      message: 'Notification sent successfully',
      notification: populated,
    });
  } catch (error) {
    next(error);
  }
};
