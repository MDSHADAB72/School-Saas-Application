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
  publishedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

resultSchema.index({ schoolId: 1, examinationId: 1, studentId: 1 }, { unique: true });

export default mongoose.model('Result', resultSchema);
