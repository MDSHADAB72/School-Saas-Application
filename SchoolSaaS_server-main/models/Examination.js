import mongoose from 'mongoose';

const examinationSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  // Support both old and new field names
  title: { type: String },
  examName: { type: String },
  code: { type: String },
  examType: { type: String },
  description: String,
  type: { type: String, enum: ['unit', 'midterm', 'final', 'class_test'], default: 'unit' },
  class: { type: String, required: true },
  section: { type: String },
  sections: [{ type: String }],
  subject: { type: String },
  date: { type: Date },
  examDate: { type: Date },
  startAt: { type: Date },
  duration: { type: Number },
  durationMinutes: { type: Number },
  subjects: [{
    name: { type: String },
    maxMarks: { type: Number },
    passingMarks: { type: Number }
  }],
  totalMarks: { type: Number },
  passingMarks: { type: Number },
  venue: String,
  invigilator: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  status: { type: String, enum: ['draft', 'public', 'private'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

examinationSchema.index({ schoolId: 1, class: 1, date: 1 });

export default mongoose.model('Examination', examinationSchema);
