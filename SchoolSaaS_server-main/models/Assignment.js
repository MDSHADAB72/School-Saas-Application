import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  class: { type: String, required: true },
  section: { type: String, required: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  instructions: String,
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  totalMarks: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

assignmentSchema.index({ schoolId: 1, class: 1, dueDate: 1 });

export default mongoose.model('Assignment', assignmentSchema);
