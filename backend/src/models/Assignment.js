import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
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
      required: [true, 'Zone ID is required'],
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Assignment date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
    },
    assignedTimeSlot: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['assigned', 'active', 'accepted', 'declined', 'completed', 'cancelled'],
      default: 'assigned',
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate assignedTimeSlot if not explicitly provided
assignmentSchema.pre('save', function () {
  if (!this.assignedTimeSlot && this.startTime && this.endTime) {
    this.assignedTimeSlot = `${this.startTime} - ${this.endTime}`;
  }
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
