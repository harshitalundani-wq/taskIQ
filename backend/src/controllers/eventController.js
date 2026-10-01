import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Zone from '../models/Zone.js';
import Assignment from '../models/Assignment.js';
import { createNotification } from '../utils/notificationHelper.js';

// @desc    Create a new event (Admin only)
// @route   POST /api/admin/events
// @access  Private (Admin only)
export const createEvent = async (req, res, next) => {
  try {
    const { name, description, date, startTime, endTime, location, status } = req.body;

    if (!name || !description || !date || !startTime || !endTime || !location) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, description, date, startTime, endTime, and location',
      });
    }

    const event = await Event.create({
      name: name.trim(),
      description: description.trim(),
      date: new Date(date),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      location: location.trim(),
      status: status || 'upcoming',
    });

    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all events (Admin only)
// @route   GET /api/admin/events
// @access  Private (Admin only)
export const getAllEventsAdmin = async (req, res, next) => {
  try {
    const events = await Event.find({}).sort({ date: 1, createdAt: -1 });

    res.status(200).json({
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event by ID (Admin only)
// @route   GET /api/admin/events/:id
// @access  Private (Admin only)
export const getEventByIdAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const zones = await Zone.find({ eventId: id });

    res.status(200).json({
      event,
      zones,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an event (Admin only)
// @route   PUT /api/admin/events/:id
// @access  Private (Admin only)
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { name, description, date, startTime, endTime, location, status } = req.body;

    if (name !== undefined) event.name = name.trim();
    if (description !== undefined) event.description = description.trim();
    if (date !== undefined) event.date = new Date(date);
    if (startTime !== undefined) event.startTime = startTime.trim();
    if (endTime !== undefined) event.endTime = endTime.trim();
    if (location !== undefined) event.location = location.trim();
    if (status !== undefined) {
      const allowedStatus = ['upcoming', 'ongoing', 'completed', 'cancelled'];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          message: `Status must be one of: ${allowedStatus.join(', ')}`,
        });
      }
      event.status = status;
    }

    const updatedEvent = await event.save();

    // Automatically notify users assigned to this event
    const assignments = await Assignment.find({ eventId: id });
    const userIds = [...new Set(assignments.map((a) => a.userId.toString()))];
    for (const uId of userIds) {
      await createNotification({
        userId: uId,
        title: 'Event Update',
        message: `Event "${updatedEvent.name}" details have been updated (Status: ${updatedEvent.status}, Location: ${updatedEvent.location}).`,
        type: 'event',
        relatedEvent: id,
      });
    }

    res.status(200).json({
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an event and its associated zones (Admin only)
// @route   DELETE /api/admin/events/:id
// @access  Private (Admin only)
export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await Event.findByIdAndDelete(id);
    // Cascade delete all zones in this event
    await Zone.deleteMany({ eventId: id });

    res.status(200).json({
      message: 'Event and associated zones deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active/upcoming events for users
// @route   GET /api/events
// @access  Private (User & Admin)
export const getEventsForUser = async (req, res, next) => {
  try {
    const events = await Event.find({ status: { $ne: 'cancelled' } }).sort({ date: 1 });

    res.status(200).json({
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event by ID for user
// @route   GET /api/events/:id
// @access  Private (User & Admin)
export const getEventByIdForUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({
      event,
    });
  } catch (error) {
    next(error);
  }
};
