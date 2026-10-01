import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['assignment', 'event', 'task', 'attendance', 'emergency', 'general', 'rewards', 'info', 'warning', 'alert'],
      default: 'general',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    relatedAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
