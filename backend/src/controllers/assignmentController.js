import mongoose from 'mongoose';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Task from '../models/Task.js';
import Zone from '../models/Zone.js';
import { createNotification } from '../utils/notificationHelper.js';

// @desc    Create a new assignment (Admin only)
// @route   POST /api/admin/assignments
// @access  Private (Admin only)
export const createAssignment = async (req, res, next) => {
  try {
    const { userId, eventId, taskId, zoneId, date, startTime, endTime, status } = req.body;

    if (!userId || !eventId || !taskId || !zoneId || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: 'Please provide all required assignment fields: userId, eventId, taskId, zoneId, date, startTime, endTime',
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(eventId) ||
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(zoneId)
    ) {
      return res.status(400).json({ message: 'Invalid ID format in assignment payload' });
    }

    // 1. Verify User exists
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Verify Event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 3. Verify Task exists and belongs to event
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (task.eventId.toString() !== eventId) {
      return res.status(400).json({ message: 'Task does not belong to the specified event' });
    }

    // 4. Verify Zone exists and belongs to event
    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({ message: 'Zone not found' });
    }
    if (zone.eventId.toString() !== eventId) {
      return res.status(400).json({ message: 'Zone does not belong to the specified event' });
    }

    const assignmentDate = new Date(date);

    // 5. Check for conflicting assignment for this user on the same date and overlapping time
    const conflicting = await Assignment.findOne({
      userId,
      date: assignmentDate,
      status: { $in: ['assigned', 'active', 'accepted'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });

    if (conflicting) {
      return res.status(400).json({
        message: 'Conflict detected: User is already assigned to a task during this time slot',
      });
    }

    const assignedTimeSlot = `${startTime.trim()} - ${endTime.trim()}`;

    const assignment = await Assignment.create({
      userId,
      eventId,
      taskId,
      zoneId,
      date: assignmentDate,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      assignedTimeSlot,
      status: status || 'assigned',
    });

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('userId', 'name email phone skills interests role')
      .populate('eventId', 'name date location status')
      .populate('taskId', 'title name description status')
      .populate('zoneId', 'name description capacity');

    // Automatically notify the assigned user
    await createNotification({
      userId,
      title: 'New Event Task Assigned',
      message: `You have been assigned to task "${task.title || task.name}" in zone "${zone.name}" for event "${event.name}" (${assignedTimeSlot}).`,
      type: 'assignment',
      relatedEvent: eventId,
      relatedAssignment: assignment._id,
    });

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: populatedAssignment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all assignments (Admin only)
// @route   GET /api/admin/assignments
// @access  Private (Admin only)
export const getAllAssignmentsAdmin = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.eventId) filter.eventId = req.query.eventId;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.taskId) filter.taskId = req.query.taskId;
    if (req.query.zoneId) filter.zoneId = req.query.zoneId;
    if (req.query.status) filter.status = req.query.status;

    const assignments = await Assignment.find(filter)
      .populate('userId', 'name email phone skills interests role')
      .populate('eventId', 'name date location status')
      .populate('taskId', 'title name description status')
      .populate('zoneId', 'name description capacity')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single assignment by ID (Admin only)
// @route   GET /api/admin/assignments/:id
// @access  Private (Admin only)
export const getAssignmentByIdAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid assignment ID format' });
    }

    const assignment = await Assignment.findById(id)
      .populate('userId', 'name email phone skills interests role')
      .populate('eventId', 'name date location status')
      .populate('taskId', 'title name description status')
      .populate('zoneId', 'name description capacity');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.status(200).json({
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an assignment (Admin only)
// @route   PUT /api/admin/assignments/:id
// @access  Private (Admin only)
export const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid assignment ID format' });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const { userId, eventId, taskId, zoneId, date, startTime, endTime, status } = req.body;

    if (userId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      assignment.userId = userId;
    }

    const targetEventId = eventId || assignment.eventId;
    if (eventId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: 'Event not found' });
      assignment.eventId = eventId;
    }

    if (taskId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID' });
      }
      const task = await Task.findById(taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });
      if (task.eventId.toString() !== targetEventId.toString()) {
        return res.status(400).json({ message: 'Task does not belong to the specified event' });
      }
      assignment.taskId = taskId;
    }

    if (zoneId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(zoneId)) {
        return res.status(400).json({ message: 'Invalid zone ID' });
      }
      const zone = await Zone.findById(zoneId);
      if (!zone) return res.status(404).json({ message: 'Zone not found' });
      if (zone.eventId.toString() !== targetEventId.toString()) {
        return res.status(400).json({ message: 'Zone does not belong to the specified event' });
      }
      assignment.zoneId = zoneId;
    }

    if (date !== undefined) assignment.date = new Date(date);
    if (startTime !== undefined) assignment.startTime = startTime.trim();
    if (endTime !== undefined) assignment.endTime = endTime.trim();

    if (startTime !== undefined || endTime !== undefined) {
      assignment.assignedTimeSlot = `${assignment.startTime} - ${assignment.endTime}`;
    }

    if (status !== undefined) {
      const validStatuses = ['assigned', 'active', 'accepted', 'declined', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Status must be one of: ${validStatuses.join(', ')}`,
        });
      }
      assignment.status = status;
    }

    await assignment.save();

    const updated = await Assignment.findById(id)
      .populate('userId', 'name email phone skills interests role')
      .populate('eventId', 'name date location status')
      .populate('taskId', 'title name description status')
      .populate('zoneId', 'name description capacity');

    // Notify user of updated assignment
    await createNotification({
      userId: updated.userId?._id || updated.userId,
      title: 'Assignment Details Updated',
      message: `Your assignment for event "${updated.eventId?.name || 'Event'}" has been updated (Status: ${updated.status}, Shift: ${updated.assignedTimeSlot}).`,
      type: 'assignment',
      relatedEvent: updated.eventId?._id || updated.eventId,
      relatedAssignment: updated._id,
    });

    res.status(200).json({
      message: 'Assignment updated successfully',
      assignment: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an assignment (Admin only)
// @route   DELETE /api/admin/assignments/:id
// @access  Private (Admin only)
export const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid assignment ID format' });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await Assignment.findByIdAndDelete(id);

    // Notify user of cancelled assignment
    await createNotification({
      userId: assignment.userId,
      title: 'Assignment Cancelled',
      message: `Your assignment scheduled for ${assignment.assignedTimeSlot} has been cancelled by administration.`,
      type: 'assignment',
      relatedEvent: assignment.eventId,
    });

    res.status(200).json({
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's assignments (User view)
// @route   GET /api/users/assignments
// @access  Private (User & Admin)
export const getUserAssignments = async (req, res, next) => {
  try {
    const assignments = await Assignment.find({ userId: req.user._id })
      .populate('eventId', 'name description date startTime endTime location status')
      .populate('taskId', 'title name description status startTime endTime')
      .populate('zoneId', 'name description capacity')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    next(error);
  }
};
