import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  examinationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Examination',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subjectId: { type: String },
  subjectName: { type: String },
  marksObtained: { type: Number },
  maxMarks: { type: Number },
  passingMarks: { type: Number },
  status: { type: String, enum: ['Pass', 'Fail', 'Absent'] },
  grade: String,
  subjectResults: [{
    subjectName: { type: String, required: true },
    marksObtained: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    status: { type: String, enum: ['Pass', 'Fail'] },
    grade: String
  }],
  totalMarksObtained: { type: Number, required: true },
  totalMaxMarks: { type: Number, required: true },
  percentage: { type: Number },
  overallGrade: String,
  overallStatus: { type: String, enum: ['Pass', 'Fail'] },
  remarks: String,
  isDraft: { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  rejectionReason: String,
  publishedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

resultSchema.index({ schoolId: 1, examinationId: 1, studentId: 1 }, { unique: true });

export default mongoose.model('Result', resultSchema);
