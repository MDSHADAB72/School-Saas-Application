import mongoose from 'mongoose';

const examinationSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  title: { type: String, required: true },
  code: { type: String },
  description: String,
  type: { type: String, enum: ['unit', 'midterm', 'final', 'class_test'], default: 'unit' },
  class: { type: String, required: true },
  sections: [{ type: String }],
  date: { type: Date, required: true },
  startAt: { type: Date },
  durationMinutes: { type: Number, required: true },
  subjects: [{
    name: { type: String, required: true },
    maxMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true }
  }],
  totalMarks: { type: Number, required: true },
  passingMarks: { type: Number, required: true },
  venue: String,
  invigilator: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  status: { type: String, enum: ['draft', 'public', 'private'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

examinationSchema.index({ schoolId: 1, class: 1, date: 1 });

export default mongoose.model('Examination', examinationSchema);
