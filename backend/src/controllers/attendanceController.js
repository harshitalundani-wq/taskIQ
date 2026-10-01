import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Assignment from '../models/Assignment.js';
import Zone from '../models/Zone.js';

// @desc    Record/mark attendance (Admin only)
// @route   POST /api/admin/attendance
// @access  Private (Admin only)
export const recordAttendanceAdmin = async (req, res, next) => {
  try {
    const {
      userId,
      eventId,
      assignmentId,
      zoneId,
      date,
      checkInTime,
      checkOutTime,
      status,
      earlyCheckout,
      earlyCheckoutReason,
    } = req.body;

    if (!userId || !eventId) {
      return res.status(400).json({
        message: 'userId and eventId are required to record attendance',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid ID format in attendance payload' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    let finalZoneId = zoneId;
    if (assignmentId && mongoose.Types.ObjectId.isValid(assignmentId)) {
      const assignment = await Assignment.findById(assignmentId);
      if (assignment && !finalZoneId) {
        finalZoneId = assignment.zoneId;
      }
    }

    const attendance = await Attendance.create({
      userId,
      eventId,
      zoneId: finalZoneId || undefined,
      assignmentId: assignmentId && mongoose.Types.ObjectId.isValid(assignmentId) ? assignmentId : undefined,
      date: date ? new Date(date) : new Date(),
      checkInTime: checkInTime ? new Date(checkInTime) : new Date(),
      checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      earlyCheckout: Boolean(earlyCheckout),
      earlyCheckoutReason: earlyCheckoutReason ? String(earlyCheckoutReason).trim() : '',
      status: status || 'present',
    });

    const populated = await Attendance.findById(attendance._id)
      .populate('userId', 'name email phone role')
      .populate('eventId', 'name date location status')
      .populate('zoneId', 'name capacity')
      .populate('assignmentId', 'assignedTimeSlot status startTime endTime');

    res.status(201).json({
      message: 'Attendance recorded successfully',
      attendance: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendance records (Admin only)
// @route   GET /api/admin/attendance
// @access  Private (Admin only)
export const getAllAttendanceAdmin = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.eventId) filter.eventId = req.query.eventId;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.zoneId) filter.zoneId = req.query.zoneId;

    const attendance = await Attendance.find(filter)
      .populate('userId', 'name email phone role')
      .populate('eventId', 'name date location status')
      .populate('zoneId', 'name capacity')
      .populate('assignmentId', 'assignedTimeSlot status startTime endTime')
      .sort({ date: -1, checkInTime: -1 });

    res.status(200).json({
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single attendance record by ID (Admin only)
// @route   GET /api/admin/attendance/:id
// @access  Private (Admin only)
export const getAttendanceByIdAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid attendance ID format' });
    }

    const attendance = await Attendance.findById(id)
      .populate('userId', 'name email phone role')
      .populate('eventId', 'name date location status')
      .populate('zoneId', 'name capacity')
      .populate('assignmentId', 'assignedTimeSlot status startTime endTime');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.status(200).json({
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update/correct attendance record (Admin only)
// @route   PUT /api/admin/attendance/:id
// @access  Private (Admin only)
export const updateAttendanceAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid attendance ID format' });
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const {
      checkInTime,
      checkOutTime,
      status,
      earlyCheckout,
      earlyCheckoutReason,
      date,
    } = req.body;

    if (checkInTime !== undefined) attendance.checkInTime = checkInTime ? new Date(checkInTime) : null;
    if (checkOutTime !== undefined) attendance.checkOutTime = checkOutTime ? new Date(checkOutTime) : null;
    if (date !== undefined) attendance.date = new Date(date);
    if (earlyCheckout !== undefined) attendance.earlyCheckout = Boolean(earlyCheckout);
    if (earlyCheckoutReason !== undefined) attendance.earlyCheckoutReason = String(earlyCheckoutReason).trim();

    if (status !== undefined) {
      const allowed = ['present', 'absent', 'late', 'checked-out'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
      }
      attendance.status = status;
    }

    await attendance.save();

    const updated = await Attendance.findById(id)
      .populate('userId', 'name email phone role')
      .populate('eventId', 'name date location status')
      .populate('zoneId', 'name capacity')
      .populate('assignmentId', 'assignedTimeSlot status startTime endTime');

    res.status(200).json({
      message: 'Attendance record updated successfully',
      attendance: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete attendance record (Admin only)
// @route   DELETE /api/admin/attendance/:id
// @access  Private (Admin only)
export const deleteAttendanceAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid attendance ID format' });
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    await Attendance.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's attendance history (User view)
// @route   GET /api/users/attendance
// @access  Private (User & Admin)
export const getUserAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.find({ userId: req.user._id })
      .populate('eventId', 'name date location status')
      .populate('zoneId', 'name capacity')
      .populate('assignmentId', 'assignedTimeSlot status startTime endTime')
      .sort({ date: -1, checkInTime: -1 });

    res.status(200).json({
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    User check-in (Basic attendance check-in without QR)
// @route   POST /api/users/attendance/check-in
// @access  Private (User & Admin)
export const userCheckIn = async (req, res, next) => {
  try {
    const { eventId, assignmentId, zoneId } = req.body;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Valid eventId is required for check-in' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if user already checked in today for this event
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      userId: req.user._id,
      eventId,
      date: { $gte: startOfDay },
    });

    if (existingAttendance && !existingAttendance.checkOutTime) {
      return res.status(400).json({
        message: 'You are already checked in for this event today',
        attendance: existingAttendance,
      });
    }

    const attendance = await Attendance.create({
      userId: req.user._id,
      eventId,
      zoneId: zoneId && mongoose.Types.ObjectId.isValid(zoneId) ? zoneId : undefined,
      assignmentId: assignmentId && mongoose.Types.ObjectId.isValid(assignmentId) ? assignmentId : undefined,
      date: new Date(),
      checkInTime: new Date(),
      status: 'present',
    });

    res.status(201).json({
      message: 'Checked in successfully',
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    User check-out (Basic attendance check-out)
// @route   POST /api/users/attendance/check-out
// @access  Private (User & Admin)
export const userCheckOut = async (req, res, next) => {
  try {
    const { eventId, earlyCheckoutReason } = req.body;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Valid eventId is required for check-out' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId: req.user._id,
      eventId,
      checkOutTime: null,
      date: { $gte: startOfDay },
    });

    if (!attendance) {
      return res.status(400).json({
        message: 'No active check-in found for this event today to check out from',
      });
    }

    attendance.checkOutTime = new Date();
    attendance.status = 'checked-out';
    if (earlyCheckoutReason) {
      attendance.earlyCheckout = true;
      attendance.earlyCheckoutReason = String(earlyCheckoutReason).trim();
    }

    await attendance.save();

    res.status(200).json({
      message: 'Checked out successfully',
      attendance,
    });
  } catch (error) {
    next(error);
  }
};
