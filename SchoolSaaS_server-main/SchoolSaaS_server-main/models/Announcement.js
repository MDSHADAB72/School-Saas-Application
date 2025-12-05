import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  content: String,
  audience: {
    type: String,
    enum: ['All', 'Teachers', 'Students', 'Parents', 'Class Specific'],
    default: 'All'
  },
  class: String,
  section: String,
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  publishDate: { type: Date, default: Date.now },
  expiryDate: Date,
  attachments: [String],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

announcementSchema.index({ schoolId: 1, publishDate: -1 });

export default mongoose.model('Announcement', announcementSchema);
