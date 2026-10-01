import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    earlyCheckout: {
      type: Boolean,
      default: false,
    },
    earlyCheckoutReason: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'checked-out'],
      default: 'present',
    },
  },
  {
    timestamps: true,
  }
);

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
