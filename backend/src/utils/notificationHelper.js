import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Creates a notification for a specific user
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type = 'general',
  relatedEvent,
  relatedAssignment,
}) => {
  try {
    return await Notification.create({
      userId,
      title,
      message,
      type,
      relatedEvent,
      relatedAssignment,
    });
  } catch (error) {
    console.error('Failed to create automatic notification:', error.message);
  }
};

/**
 * Dispatches emergency / high-priority notifications to all admin users
 */
export const notifyAllAdmins = async ({
  title,
  message,
  type = 'emergency',
  relatedEvent,
}) => {
  try {
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map((admin) => ({
      userId: admin._id,
      title,
      message,
      type,
      relatedEvent,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Failed to notify admins:', error.message);
  }
};
