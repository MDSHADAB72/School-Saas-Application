import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['public', 'private', 'international', 'boarding'],
    required: true
  },
  establishedYear: { type: Number, required: true },
  board: {
    type: String,
    enum: ['cbse', 'icse', 'state', 'ib', 'cambridge'],
    required: true
  },
  email: { type: String, unique: true, sparse: true },
  phoneNumber: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  registrationNumber: { type: String, unique: true, sparse: true },
  principalName: String,
  subscription: {
    plan: {
      type: String,
      enum: ['starter', 'professional', 'enterprise'],
      default: 'starter'
    },
    status: {
      type: String,
      enum: ['trial', 'active', 'inactive', 'suspended'],
      default: 'trial'
    },
    startDate: Date,
    endDate: Date
  },
  totalStudents: { type: Number, default: 0 },
  totalTeachers: { type: Number, default: 0 },
  totalClasses: { type: Number, default: 0 },
  logo: String,
  features: [String],
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('School', schoolSchema);
