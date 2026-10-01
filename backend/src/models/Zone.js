import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [0, 'Capacity cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

const Zone = mongoose.model('Zone', zoneSchema);

export default Zone;
