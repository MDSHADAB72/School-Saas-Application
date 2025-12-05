import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['assignment_submit', 'fee_payment', 'result_view', 'attendance_view', 'announcement_view', 'login', 'profile_update'],
    required: true
  },
  message: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ schoolId: 1, createdAt: -1 });

export default mongoose.model('Activity', activitySchema);
