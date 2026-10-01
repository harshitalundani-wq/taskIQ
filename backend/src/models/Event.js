import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
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
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model('Event', eventSchema);

export default Event;
