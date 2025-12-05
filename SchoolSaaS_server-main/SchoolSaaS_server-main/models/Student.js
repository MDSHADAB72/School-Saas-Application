import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
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
  studentId: { type: String, unique: true },
  rollNumber: { type: String, required: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
  parentEmail: String,
  parentPhone: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: String,
  address: String,
  admissionNumber: { type: String, unique: true },
  admissionDate: Date,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

studentSchema.index({ schoolId: 1, class: 1, section: 1 });

export default mongoose.model('Student', studentSchema);
