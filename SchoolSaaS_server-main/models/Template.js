import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  type: {
    type: String,
    enum: ['FEE_RECEIPT', 'ADMIT_CARD', 'RESULT_CARD', 'NOTICE', 'CERTIFICATE'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  html: {
    type: String,
    required: true
  },
  css: {
    type: String,
    default: ''
  },
  variables: [{
    type: String
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  version: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

templateSchema.index({ schoolId: 1, type: 1 });
templateSchema.index({ schoolId: 1, isDefault: 1 });

export default mongoose.model('Template', templateSchema);