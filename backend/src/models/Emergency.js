import mongoose from 'mongoose';

const emergencySchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporting user ID is required'],
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
    title: {
      type: String,
      required: [true, 'Emergency title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Emergency description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'acknowledged', 'resolved', 'cancelled'],
      default: 'open',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Emergency = mongoose.model('Emergency', emergencySchema);

export default Emergency;
