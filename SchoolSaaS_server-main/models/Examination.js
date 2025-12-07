import mongoose from 'mongoose';

const examinationSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  examName: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['unit', 'midterm', 'final', 'class_test'], default: 'unit' },
  class: { type: String, required: true },
  section: { type: String, required: true },
  examStartDate: { type: Date, required: true },
  examEndDate: { type: Date, required: true },
  subjects: [{
    subjectName: { type: String, required: true },
    examDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    duration: { type: Number, required: true },
    roomNumber: { type: String },
    maxMarks: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number },
    invigilators: [{
      teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: false },
      teacherName: { type: String, required: false },
      role: { type: String, enum: ['Chief Invigilator', 'Invigilator', 'Relief'], default: 'Invigilator' }
    }]
  }],
  status: { type: String, enum: ['draft', 'public', 'private'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

examinationSchema.index({ schoolId: 1, class: 1, date: 1 });

export default mongoose.model('Examination', examinationSchema);
