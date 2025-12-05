import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  class: { type: String, required: true },
  section: { type: String, required: true },
  feeMonth: { type: String, required: true },
  amount: { type: Number, required: true },
  feeType: { type: String, enum: ['Tuition', 'Transport', 'Hostel', 'Activity', 'Other'] },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Partial', 'Overdue'],
    default: 'Pending'
  },
  dueDate: Date,
  paidDate: Date,
  paidAmount: { type: Number, default: 0 },
  paymentMethod: String,
  transactionId: String,
  receiptNumber: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

feeSchema.index({ schoolId: 1, studentId: 1, feeMonth: 1 });
feeSchema.index({ schoolId: 1, status: 1 });

export default mongoose.model('Fee', feeSchema);
