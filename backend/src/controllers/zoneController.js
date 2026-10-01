import mongoose from 'mongoose';
import Zone from '../models/Zone.js';
import Event from '../models/Event.js';

// @desc    Create a new zone for an event (Admin only)
// @route   POST /api/admin/events/:eventId/zones
// @access  Private (Admin only)
export const createZone = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { name, description, capacity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!name || capacity === undefined) {
      return res.status(400).json({
        message: 'Please provide required zone fields: name and capacity',
      });
    }

    const parsedCapacity = Number(capacity);
    if (isNaN(parsedCapacity) || parsedCapacity < 0) {
      return res.status(400).json({
        message: 'Capacity must be a non-negative number',
      });
    }

    const zone = await Zone.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      eventId,
      capacity: parsedCapacity,
    });

    res.status(201).json({
      message: 'Zone created successfully',
      zone,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all zones for an event (Admin only)
// @route   GET /api/admin/events/:eventId/zones
// @access  Private (Admin only)
export const getZonesByEventAdmin = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const zones = await Zone.find({ eventId }).sort({ createdAt: 1 });

    res.status(200).json({
      count: zones.length,
      zones,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single zone by ID (Admin only)
// @route   GET /api/admin/zones/:id
// @access  Private (Admin only)
export const getZoneByIdAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid zone ID format' });
    }

    const zone = await Zone.findById(id).populate('eventId', 'name date location status');
    if (!zone) {
      return res.status(404).json({ message: 'Zone not found' });
    }

    res.status(200).json({
      zone,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a zone (Admin only)
// @route   PUT /api/admin/zones/:id
// @access  Private (Admin only)
export const updateZone = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid zone ID format' });
    }

    const zone = await Zone.findById(id);
    if (!zone) {
      return res.status(404).json({ message: 'Zone not found' });
    }

    const { name, description, capacity } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Zone name cannot be empty' });
      }
      zone.name = name.trim();
    }

    if (description !== undefined) {
      zone.description = typeof description === 'string' ? description.trim() : '';
    }

    if (capacity !== undefined) {
      const parsedCapacity = Number(capacity);
      if (isNaN(parsedCapacity) || parsedCapacity < 0) {
        return res.status(400).json({ message: 'Capacity must be a non-negative number' });
      }
      zone.capacity = parsedCapacity;
    }

    const updatedZone = await zone.save();

    res.status(200).json({
      message: 'Zone updated successfully',
      zone: updatedZone,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a zone (Admin only)
// @route   DELETE /api/admin/zones/:id
// @access  Private (Admin only)
export const deleteZone = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid zone ID format' });
    }

    const zone = await Zone.findById(id);
    if (!zone) {
      return res.status(404).json({ message: 'Zone not found' });
    }

    await Zone.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Zone deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all zones for an event (User view)
// @route   GET /api/events/:eventId/zones
// @access  Private (User & Admin)
export const getZonesByEventForUser = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const zones = await Zone.find({ eventId }).select('name description capacity eventId createdAt');

    res.status(200).json({
      count: zones.length,
      zones,
    });
  } catch (error) {
    next(error);
  }
};
