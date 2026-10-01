import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Event from '../models/Event.js';
import Zone from '../models/Zone.js';
import Assignment from '../models/Assignment.js';

// @desc    Create a new task under an event (Admin only)
// @route   POST /api/admin/events/:eventId/tasks
// @access  Private (Admin only)
export const createTask = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const {
      title,
      name,
      description,
      zone,
      zoneId,
      requiredSkills,
      requiredInterests,
      maxVolunteers,
      requiredVolunteers,
      startTime,
      endTime,
      status,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const taskTitle = title || name;
    if (!taskTitle || typeof taskTitle !== 'string' || !taskTitle.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const targetZoneId = zoneId || zone;
    if (!targetZoneId) {
      return res.status(400).json({ message: 'Zone ID is required for task' });
    }

    if (!mongoose.Types.ObjectId.isValid(targetZoneId)) {
      return res.status(400).json({ message: 'Invalid zone ID format' });
    }

    const targetZone = await Zone.findById(targetZoneId);
    if (!targetZone) {
      return res.status(404).json({ message: 'Zone not found' });
    }

    if (targetZone.eventId.toString() !== eventId) {
      return res.status(400).json({
        message: 'The selected zone does not belong to this event',
      });
    }

    const task = await Task.create({
      title: taskTitle.trim(),
      name: taskTitle.trim(),
      description: description ? description.trim() : '',
      eventId,
      zoneId: targetZoneId,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      requiredInterests: Array.isArray(requiredInterests) ? requiredInterests : [],
      maxVolunteers: Number(maxVolunteers || requiredVolunteers) || 1,
      requiredVolunteers: Number(maxVolunteers || requiredVolunteers) || 1,
      startTime: startTime ? startTime.trim() : '',
      endTime: endTime ? endTime.trim() : '',
      status: status || 'open',
    });

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks for an event (Admin only)
// @route   GET /api/admin/events/:eventId/tasks
// @access  Private (Admin only)
export const getTasksByEventAdmin = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const tasks = await Task.find({ eventId })
      .populate('zoneId', 'name description capacity')
      .populate('eventId', 'name date location status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task by ID (Admin only)
// @route   GET /api/admin/tasks/:id
// @access  Private (Admin only)
export const getTaskByIdAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    const task = await Task.findById(id)
      .populate('zoneId', 'name description capacity')
      .populate('eventId', 'name date location status');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({
      task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task (Admin only)
// @route   PUT /api/admin/tasks/:id
// @access  Private (Admin only)
export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const {
      title,
      name,
      description,
      zone,
      zoneId,
      requiredSkills,
      requiredInterests,
      maxVolunteers,
      requiredVolunteers,
      startTime,
      endTime,
      status,
    } = req.body;

    if (title !== undefined || name !== undefined) {
      const updatedTitle = (title || name || '').trim();
      if (!updatedTitle) {
        return res.status(400).json({ message: 'Task title cannot be empty' });
      }
      task.title = updatedTitle;
      task.name = updatedTitle;
    }

    if (description !== undefined) task.description = String(description).trim();

    const targetZoneId = zoneId || zone;
    if (targetZoneId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(targetZoneId)) {
        return res.status(400).json({ message: 'Invalid zone ID format' });
      }
      const targetZone = await Zone.findById(targetZoneId);
      if (!targetZone) {
        return res.status(404).json({ message: 'Zone not found' });
      }
      if (targetZone.eventId.toString() !== task.eventId.toString()) {
        return res.status(400).json({
          message: 'The selected zone does not belong to this event',
        });
      }
      task.zoneId = targetZoneId;
    }

    if (requiredSkills !== undefined) {
      task.requiredSkills = Array.isArray(requiredSkills) ? requiredSkills : [];
    }

    if (requiredInterests !== undefined) {
      task.requiredInterests = Array.isArray(requiredInterests) ? requiredInterests : [];
    }

    if (maxVolunteers !== undefined || requiredVolunteers !== undefined) {
      const count = Number(maxVolunteers || requiredVolunteers);
      if (isNaN(count) || count < 1) {
        return res.status(400).json({ message: 'Max volunteers must be at least 1' });
      }
      task.maxVolunteers = count;
      task.requiredVolunteers = count;
    }

    if (startTime !== undefined) task.startTime = String(startTime).trim();
    if (endTime !== undefined) task.endTime = String(endTime).trim();

    if (status !== undefined) {
      const validStatuses = ['open', 'pending', 'in-progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Status must be one of: ${validStatuses.join(', ')}`,
        });
      }
      task.status = status;
    }

    const updatedTask = await task.save();

    res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task (Admin only)
// @route   DELETE /api/admin/tasks/:id
// @access  Private (Admin only)
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(id);
    // Cascade cleanup assignments associated with this task
    await Assignment.deleteMany({ taskId: id });

    res.status(200).json({
      message: 'Task and associated assignments deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available tasks for an event (User view)
// @route   GET /api/events/:eventId/tasks
// @access  Private (User & Admin)
export const getTasksByEventForUser = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const tasks = await Task.find({ eventId, status: { $ne: 'cancelled' } })
      .populate('zoneId', 'name description capacity')
      .select('title name description eventId zoneId requiredSkills requiredInterests maxVolunteers startTime endTime status createdAt');

    res.status(200).json({
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};
