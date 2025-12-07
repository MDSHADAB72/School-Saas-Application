import mongoose from 'mongoose';

const periodConfigurationSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  class: {
    type: String,
    required: false
  },
  section: {
    type: String,
    required: false
  },
  workingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  }],
  periods: [{
    periodNumber: {
      type: Number,
      required: true
    },
    periodName: {
      type: String,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true
    },
    type: {
      type: String,
      enum: ['class', 'break', 'lunch'],
      default: 'class'
    },
    teacher: {
      type: String,
      required: false
    },
    subject: {
      type: String,
      required: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  totalPeriodsPerDay: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Ensure one active configuration per school, academic year, class, and section
periodConfigurationSchema.index({ schoolId: 1, academicYear: 1, class: 1, section: 1, isActive: 1 }, { 
  unique: true,
  partialFilterExpression: { isActive: true }
});

export default mongoose.model('PeriodConfiguration', periodConfigurationSchema);