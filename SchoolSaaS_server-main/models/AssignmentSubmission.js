import mongoose from 'mongoose';

const assignmentSubmissionSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  comments: String,
  submissionDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Submitted', 'Late', 'Not Submitted'],
    default: 'Submitted'
  },
  marksObtained: Number,
  feedback: String,
  reviewed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

assignmentSubmissionSchema.index({ schoolId: 1, assignmentId: 1, studentId: 1 });

export default mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
