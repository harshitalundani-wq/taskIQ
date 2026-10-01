import mongoose from 'mongoose';
import Emergency from '../models/Emergency.js';
import Event from '../models/Event.js';
import Zone from '../models/Zone.js';
import { createNotification, notifyAllAdmins } from '../utils/notificationHelper.js';

// @desc    Report an emergency (User endpoint)
// @route   POST /api/users/emergency
// @access  Private (User & Admin)
export const reportEmergency = async (req, res, next) => {
  try {
    const { eventId, zoneId, title, description, priority } = req.body;

    if (!eventId || !zoneId || !title || !description) {
      return res.status(400).json({
        message: 'Please provide all required fields: eventId, zoneId, title, and description',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(zoneId)) {
      return res.status(400).json({ message: 'Invalid event ID or zone ID format' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const zone = await Zone.findById(zoneId);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });

    if (zone.eventId.toString() !== eventId) {
      return res.status(400).json({ message: 'Zone does not belong to the specified event' });
    }

    const emergency = await Emergency.create({
      reportedBy: req.user._id,
      eventId,
      zoneId,
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'medium',
      status: 'open',
    });

    // Alert all admins immediately
    await notifyAllAdmins({
      title: `EMERGENCY ALERT [${(priority || 'medium').toUpperCase()}]: ${title.trim()}`,
      message: `${description.trim()} (Event: ${event.name}, Zone: ${zone.name}, Reported by: ${req.user.name})`,
      type: 'emergency',
      relatedEvent: eventId,
    });

    const populated = await Emergency.findById(emergency._id)
      .populate('reportedBy', 'name email phone role')
      .populate('eventId', 'name location date status')
      .populate('zoneId', 'name capacity');

    res.status(201).json({
      message: 'Emergency reported successfully. Administrators have been notified.',
      emergency: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get emergencies reported by current user
// @route   GET /api/users/emergency
// @access  Private (User & Admin)
export const getUserEmergencies = async (req, res, next) => {
  try {
    const emergencies = await Emergency.find({ reportedBy: req.user._id })
      .populate('eventId', 'name location date status')
      .populate('zoneId', 'name capacity')
      .populate('resolvedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: emergencies.length,
      emergencies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all emergencies (Admin only)
// @route   GET /api/admin/emergencies
// @access  Private (Admin only)
export const getAllEmergenciesAdmin = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.eventId) filter.eventId = req.query.eventId;

    const emergencies = await Emergency.find(filter)
      .populate('reportedBy', 'name email phone role')
      .populate('eventId', 'name location date status')
      .populate('zoneId', 'name capacity')
      .populate('resolvedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: emergencies.length,
      emergencies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single emergency by ID (Admin only)
// @route   GET /api/admin/emergencies/:id
// @access  Private (Admin only)
export const getEmergencyByIdAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid emergency ID format' });
    }

    const emergency = await Emergency.findById(id)
      .populate('reportedBy', 'name email phone role')
      .populate('eventId', 'name location date status')
      .populate('zoneId', 'name capacity')
      .populate('resolvedBy', 'name email role');

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency record not found' });
    }

    res.status(200).json({
      emergency,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update emergency status and details (Admin only)
// @route   PATCH /api/admin/emergencies/:id/status
// @access  Private (Admin only)
export const updateEmergencyStatusAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid emergency ID format' });
    }

    const emergency = await Emergency.findById(id);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency record not found' });
    }

    const { status, priority, description } = req.body;

    if (priority !== undefined) {
      const allowedPriorities = ['low', 'medium', 'high', 'critical'];
      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({ message: `Priority must be one of: ${allowedPriorities.join(', ')}` });
      }
      emergency.priority = priority;
    }

    if (description !== undefined) {
      emergency.description = String(description).trim();
    }

    if (status !== undefined) {
      const allowedStatuses = ['open', 'acknowledged', 'resolved', 'cancelled'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Status must be one of: ${allowedStatuses.join(', ')}` });
      }
      emergency.status = status;

      if (status === 'resolved') {
        emergency.resolvedAt = new Date();
        emergency.resolvedBy = req.user._id;
      } else {
        emergency.resolvedAt = null;
        emergency.resolvedBy = null;
      }

      // Notify the reporter about the status change
      await createNotification({
        userId: emergency.reportedBy,
        title: 'Emergency Status Update',
        message: `Your reported emergency "${emergency.title}" status has been updated to: ${status.toUpperCase()}`,
        type: 'emergency',
        relatedEvent: emergency.eventId,
      });
    }

    await emergency.save();

    const updated = await Emergency.findById(id)
      .populate('reportedBy', 'name email phone role')
      .populate('eventId', 'name location date status')
      .populate('zoneId', 'name capacity')
      .populate('resolvedBy', 'name email role');

    res.status(200).json({
      message: 'Emergency updated successfully',
      emergency: updated,
    });
  } catch (error) {
    next(error);
  }
};
