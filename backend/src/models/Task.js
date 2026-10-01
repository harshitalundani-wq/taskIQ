import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    name: {
      type: String,
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
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'Zone ID is required'],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    requiredInterests: {
      type: [String],
      default: [],
    },
    maxVolunteers: {
      type: Number,
      required: [true, 'Max volunteers count is required'],
      min: [1, 'At least 1 volunteer is required'],
      default: 1,
    },
    requiredVolunteers: {
      type: Number,
      min: [1, 'At least 1 volunteer is required'],
      default: 1,
    },
    startTime: {
      type: String,
      default: '',
      trim: true,
    },
    endTime: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'pending', 'in-progress', 'completed', 'cancelled'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

// Keep name and title synced for backwards/flexible compatibility
taskSchema.pre('save', function () {
  if (this.title && !this.name) this.name = this.title;
  if (this.name && !this.title) this.title = this.name;
  if (this.maxVolunteers && !this.requiredVolunteers) this.requiredVolunteers = this.maxVolunteers;
  if (this.requiredVolunteers && !this.maxVolunteers) this.maxVolunteers = this.requiredVolunteers;
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
