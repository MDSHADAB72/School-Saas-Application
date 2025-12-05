import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: false
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: false, default: '' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['super_admin', 'school_admin', 'teacher', 'parent', 'student'],
    required: true
  },
  phoneNumber: String,
  profilePhoto: String,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.index({ schoolId: 1, email: 1 });

export default mongoose.model('User', userSchema);
