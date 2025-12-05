import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    class: { type: String, required: true },
    section: { type: String, required: true },
    date: { type: Date, required: true },
    // models/Attendance.js (status field)
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      required: true,
      lowercase: true,
      trim: true,
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remarks: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

attendanceSchema.index({ schoolId: 1, studentId: 1, date: 1 });
attendanceSchema.index({ schoolId: 1, class: 1, section: 1, date: 1 });

export default mongoose.model("Attendance", attendanceSchema);
