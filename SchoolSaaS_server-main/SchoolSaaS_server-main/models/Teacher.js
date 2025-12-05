import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
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
  employeeId: { type: String, required: true, unique: true },
  qualification: String,
  subject: String,
  classesAssigned: [String],
  sectionsAssigned: [String],
  dateOfJoining: Date,
  experience: Number,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

teacherSchema.index({ schoolId: 1, subject: 1 });

export default mongoose.model('Teacher', teacherSchema);
