// controllers/attendanceController.js
import Attendance from '../models/Attendance.js';

const ALLOWED_STATUSES = ['present', 'absent', 'late'];

function normalizeStatus(raw) {
  if (raw === undefined || raw === null) return raw;
  return String(raw).toLowerCase().trim();
}

function dayRangeFromDate(dateInput) {
  const start = new Date(dateInput);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateInput);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export const getAllAttendance = async (req, res) => {
  try {
    const { schoolId, role, userId } = req.user;
    const { page = 1, limit = 10, studentId, class: className, section, date, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let filter = { schoolId };
    
    // If student or parent, filter by their student record
    if (role === 'student' || role === 'parent') {
      const Student = (await import('../models/Student.js')).default;
      const student = await Student.findOne({ userId, schoolId });
      if (student) {
        filter.studentId = student._id;
      } else {
        return res.json({ attendance: [], pagination: { page: parseInt(page), limit: parseInt(limit), total: 0 } });
      }
    } else {
      // For admins/teachers, allow filtering
      if (studentId) filter.studentId = studentId;
      if (className) filter.class = className;
      if (section) filter.section = section;
    }
    
    if (date) {
      const { start, end } = dayRangeFromDate(date);
      filter.date = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(filter)
      .populate('studentId', 'rollNumber studentId class section')
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName' } })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    const total = await Attendance.countDocuments(filter);

    res.json({
      attendance,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { schoolId, userId, _id } = req.user;
    const { studentId, class: className, section, date, status: rawStatus, remarks } = req.body;

    const normalizedStatus = normalizeStatus(rawStatus);

    console.log('Mark attendance request:', {
      schoolId,
      userId: userId || _id,
      studentId,
      date,
      status: normalizedStatus,
      class: className,
      section
    });

    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }

    if (!studentId || !className || !section || !date || !rawStatus) {
      return res.status(400).json({ message: 'Missing required fields: studentId, class, section, date, status' });
    }

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        message: 'Invalid status value',
        allowed: ALLOWED_STATUSES,
        received: rawStatus
      });
    }

    // Normalize date to day-range for find
    const { start: attendanceStart, end: attendanceEnd } = dayRangeFromDate(date);

    const existingAttendance = await Attendance.findOne({
      schoolId,
      studentId,
      date: { $gte: attendanceStart, $lte: attendanceEnd }
    });

    if (existingAttendance) {
      existingAttendance.status = normalizedStatus;
      if (remarks !== undefined) existingAttendance.remarks = remarks;
      existingAttendance.markedBy = userId || _id;
      await existingAttendance.save(); // will validate with schema
      console.log('Attendance updated:', existingAttendance);
      return res.json({ message: 'Attendance updated successfully', attendance: existingAttendance });
    }

    // Use start-of-day for stored date
    const attendanceDate = attendanceStart;

    const attendance = new Attendance({
      schoolId,
      studentId,
      class: className,
      section,
      date: attendanceDate,
      status: normalizedStatus,
      remarks: remarks || '',
      markedBy: userId || _id
    });

    await attendance.save();
    console.log('Attendance created:', attendance);
    res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    console.error('Attendance marking error:', error);
    // More detailed error payload for debugging (be careful in production)
    res.status(500).json({
      message: 'Error marking attendance',
      error: error.message,
      details: error.stack
    });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    // If status present in body, normalize and validate
    if (req.body.status !== undefined) {
      const normalized = normalizeStatus(req.body.status);
      if (!ALLOWED_STATUSES.includes(normalized)) {
        return res.status(400).json({ message: 'Invalid status value', allowed: ALLOWED_STATUSES });
      }
      req.body.status = normalized;
    }

    // If date provided, normalize to start-of-day
    if (req.body.date) {
      const { start } = dayRangeFromDate(req.body.date);
      req.body.date = start;
    }

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance updated successfully', attendance });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Error updating attendance', error: error.message });
  }
};

export const getAttendanceReport = async (req, res) => {
  try {
    const { schoolId, role, userId } = req.user;
    const { startDate, endDate } = req.query;
    let studentId = req.params.studentId;
    
    // If student or parent, use their own student record
    if (role === 'student' || role === 'parent') {
      const Student = (await import('../models/Student.js')).default;
      const student = await Student.findOne({ userId, schoolId });
      if (!student) {
        return res.status(404).json({ message: 'Student record not found' });
      }
      studentId = student._id;
    }

    let filter = { schoolId, studentId };
    if (startDate && endDate) {
      const s = new Date(startDate); s.setHours(0,0,0,0);
      const e = new Date(endDate); e.setHours(23,59,59,999);
      filter.date = { $gte: s, $lte: e };
    }

    const attendance = await Attendance.find(filter).sort({ date: 1 });
    const total = attendance.length;
    // normalize when counting
    const present = attendance.filter(a => normalizeStatus(a.status) === 'present').length;
    const absent = attendance.filter(a => normalizeStatus(a.status) === 'absent').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    res.json({
      report: {
        total,
        present,
        absent,
        percentage,
        attendance
      }
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({ message: 'Error generating attendance report', error: error.message });
  }
};

export const bulkMarkAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;
    const { schoolId, userId } = req.user;

    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ message: 'Attendance records array is required' });
    }

    const createdRecords = [];
    const errors = [];

    for (let i = 0; i < attendanceRecords.length; i++) {
      const row = attendanceRecords[i];
      try {
        // basic validation
        if (!row.studentId || !row.class || !row.section || !row.date || row.status === undefined) {
          throw new Error('Missing required fields (studentId, class, section, date, status)');
        }

        const normalizedStatus = normalizeStatus(row.status);
        if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
          throw new Error(`Invalid status '${row.status}'. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
        }

        const { start: recordDate } = dayRangeFromDate(row.date);

        // check & update existing if present (so bulk doesn't create duplicates)
        const existing = await Attendance.findOne({
          schoolId,
          studentId: row.studentId,
          date: { $gte: recordDate, $lte: new Date(recordDate.getTime() + 86399999) }
        });

        if (existing) {
          existing.status = normalizedStatus;
          existing.markedBy = userId;
          if (row.remarks) existing.remarks = row.remarks;
          await existing.save();
          createdRecords.push(existing);
        } else {
          const attendance = new Attendance({
            schoolId,
            studentId: row.studentId,
            class: row.class,
            section: row.section,
            date: recordDate,
            status: normalizedStatus,
            remarks: row.remarks || '',
            markedBy: userId
          });
          await attendance.save();
          createdRecords.push(attendance);
        }
      } catch (error) {
        console.error(`Bulk row ${i+1} error:`, error);
        errors.push(`Row ${i + 1}: ${error.message}`);
        // continue processing next rows
      }
    }

    res.status(201).json({
      message: 'Bulk attendance upload completed',
      count: createdRecords.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({ message: 'Failed to mark attendance', error: error.message });
  }
};
