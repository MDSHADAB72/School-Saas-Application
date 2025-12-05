import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';

export const getAllAssignments = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { page = 1, limit = 10, class: className, subject } = req.query;
    const skip = (page - 1) * limit;

    let filter = { schoolId };
    if (className) filter.class = className;
    if (subject) filter.subject = subject;

    const assignments = await Assignment.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ dueDate: -1 });

    const total = await Assignment.countDocuments(filter);

    res.json({
      assignments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const { schoolId, userId, _id } = req.user;
    const { class: className, section, subject, title, description, instructions, startDate, dueDate, totalMarks } = req.body;

    // Handle file attachments
    const attachments = req.files ? req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileType: file.mimetype
    })) : [];

    const assignment = new Assignment({
      schoolId,
      teacherId: userId || _id,
      class: className,
      section,
      subject,
      title,
      description,
      instructions,
      attachments,
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      totalMarks
    });

    await assignment.save();
    res.status(201).json({ message: 'Assignment created successfully', assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { schoolId, userId, _id, role } = req.user;
    const { assignmentId, comments } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Find student document
    const Student = (await import('../models/Student.js')).default;
    const student = await Student.findOne({ userId: userId || _id });
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    // Handle file attachments
    const attachments = req.files ? req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileType: file.mimetype
    })) : [];

    const status = new Date() > assignment.dueDate ? 'Late' : 'Submitted';

    const submission = new AssignmentSubmission({
      schoolId,
      assignmentId,
      studentId: student._id,
      attachments,
      comments,
      status
    });

    await submission.save();
    res.status(201).json({ message: 'Assignment submitted successfully', submission });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: 'Error submitting assignment', error: error.message });
  }
};

export const getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const submissions = await AssignmentSubmission.find({ assignmentId })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .sort({ submissionDate: -1 });

    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

export const getMySubmissions = async (req, res) => {
  try {
    const { userId, _id } = req.user;
    
    // Find student document
    const Student = (await import('../models/Student.js')).default;
    const student = await Student.findOne({ userId: userId || _id });
    if (!student) {
      return res.json({ submissions: [] });
    }

    const submissions = await AssignmentSubmission.find({ studentId: student._id })
      .populate('assignmentId')
      .sort({ submissionDate: -1 });

    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { marksObtained, feedback } = req.body;

    const submission = await AssignmentSubmission.findByIdAndUpdate(
      id,
      {
        marksObtained: Number(marksObtained),
        feedback,
        reviewed: true
      },
      { new: true }
    ).populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'firstName lastName email' }
    }).populate('assignmentId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({ message: 'Submission graded successfully', submission });
  } catch (error) {
    res.status(500).json({ message: 'Error grading submission', error: error.message });
  }
};
