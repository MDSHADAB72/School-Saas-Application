import Examination from '../models/Examination.js';
import Result from '../models/Result.js';
import Student from '../models/Student.js';

// Helper function to calculate grade
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

export const getAllExaminations = async (req, res) => {
  try {
    const { schoolId, role, userId, _id } = req.user;
    const { page = 1, limit = 100, class: className, status } = req.query;
    const skip = (page - 1) * limit;

    let filter = { schoolId };
    
    // For students, filter by their class
    if (role === 'student' || role === 'parent') {
      const student = await Student.findOne({ userId: userId || _id });
      if (student) {
        filter.class = student.class;
        filter.sections = student.section;
      }
      filter.status = 'public';
    } else if (role === 'school_admin') {
      if (className) filter.class = className;
      if (status) filter.status = status;
    } else {
      if (className) filter.class = className;
      filter.status = 'public';
    }

    const examinations = await Examination.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('invigilator')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    const total = await Examination.countDocuments(filter);

    res.json({
      examinations,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching examinations', error: error.message });
  }
};

export const getUpcomingExams = async (req, res) => {
  try {
    const { schoolId, userId, _id } = req.user;

    const student = await Student.findOne({ userId: userId || _id });
    if (!student) {
      return res.json({ examinations: [] });
    }

    const now = new Date();
    const examinations = await Examination.find({
      schoolId,
      class: student.class,
      sections: student.section,
      status: 'public',
      date: { $gte: now }
    })
      .populate('createdBy', 'firstName lastName')
      .sort({ date: 1 })
      .limit(10);

    res.json({ examinations });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching upcoming exams', error: error.message });
  }
};

export const createExamination = async (req, res) => {
  try {
    const { schoolId, userId, _id } = req.user;
    const { title, code, description, type, class: className, sections, date, startAt, durationMinutes, subjects, venue, invigilator, status } = req.body;

    // Validate subjects
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: 'At least one subject is required' });
    }

    // Parse subjects if they come as strings
    const parsedSubjects = subjects.map(sub => ({
      name: sub.name,
      maxMarks: Number(sub.maxMarks),
      passingMarks: Number(sub.passingMarks)
    }));

    const totalMarks = parsedSubjects.reduce((sum, sub) => sum + sub.maxMarks, 0);
    const passingMarks = parsedSubjects.reduce((sum, sub) => sum + sub.passingMarks, 0);

    // Parse sections if it's a string
    const parsedSections = Array.isArray(sections) ? sections : [];

    const examination = new Examination({
      schoolId,
      title,
      code,
      description,
      type,
      class: className,
      sections: parsedSections,
      date: new Date(date),
      startAt: startAt ? new Date(`${date}T${startAt}`) : new Date(date),
      durationMinutes: Number(durationMinutes),
      subjects: parsedSubjects,
      totalMarks,
      passingMarks,
      venue,
      invigilator: invigilator || null,
      status: status || 'draft',
      createdBy: userId || _id
    });

    await examination.save();
    res.status(201).json({ message: 'Examination created successfully', examination });
  } catch (error) {
    console.error('Create examination error:', error);
    res.status(500).json({ message: 'Error creating examination', error: error.message });
  }
};

export const updateExamination = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, code, description, type, class: className, sections, date, startAt, durationMinutes, subjects, venue, invigilator } = req.body;

    const totalMarks = subjects.reduce((sum, sub) => sum + sub.maxMarks, 0);
    const passingMarks = subjects.reduce((sum, sub) => sum + sub.passingMarks, 0);

    const examination = await Examination.findByIdAndUpdate(
      id,
      {
        title,
        code,
        description,
        type,
        class: className,
        sections,
        date: new Date(date),
        startAt: startAt ? new Date(startAt) : new Date(date),
        durationMinutes,
        subjects,
        totalMarks,
        passingMarks,
        venue,
        invigilator
      },
      { new: true }
    );

    if (!examination) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    res.json({ message: 'Examination updated successfully', examination });
  } catch (error) {
    res.status(500).json({ message: 'Error updating examination', error: error.message });
  }
};

export const submitResult = async (req, res) => {
  try {
    const { schoolId, userId, _id } = req.user;
    const { examinationId, studentId, subjectResults, remarks, isDraft } = req.body;

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    // Calculate totals
    const totalMarksObtained = subjectResults.reduce((sum, sub) => sum + sub.marksObtained, 0);
    const totalMaxMarks = subjectResults.reduce((sum, sub) => sum + sub.maxMarks, 0);
    const percentage = (totalMarksObtained / totalMaxMarks) * 100;
    const overallGrade = calculateGrade(percentage);
    
    // Check if all subjects passed
    const allPassed = subjectResults.every(sub => sub.marksObtained >= sub.passingMarks);
    const overallStatus = allPassed && totalMarksObtained >= exam.passingMarks ? 'Pass' : 'Fail';

    // Add status and grade to each subject
    const processedSubjectResults = subjectResults.map(sub => ({
      ...sub,
      status: sub.marksObtained >= sub.passingMarks ? 'Pass' : 'Fail',
      grade: calculateGrade((sub.marksObtained / sub.maxMarks) * 100)
    }));

    const result = await Result.findOneAndUpdate(
      { examinationId, studentId },
      {
        schoolId,
        examinationId,
        studentId,
        subjectResults: processedSubjectResults,
        totalMarksObtained,
        totalMaxMarks,
        percentage: percentage.toFixed(2),
        overallGrade,
        overallStatus,
        remarks,
        isDraft: isDraft !== false,
        publishedAt: isDraft === false ? new Date() : null,
        createdBy: userId || _id
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: 'Result submitted successfully', result });
  } catch (error) {
    console.error('Submit result error:', error);
    res.status(500).json({ message: 'Error submitting result', error: error.message });
  }
};

export const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { role } = req.user;

    // Students can only see published results
    const filter = { studentId };
    if (role === 'student' || role === 'parent') {
      filter.isDraft = false;
    }

    const results = await Result.find(filter)
      .populate({
        path: 'examinationId',
        match: role === 'student' || role === 'parent' ? { status: 'public' } : {}
      })
      .sort({ createdAt: -1 });

    // Filter out results where examination is null (due to status filter)
    const filteredResults = results.filter(r => r.examinationId);

    res.json({ results: filteredResults });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching results', error: error.message });
  }
};

export const getMyResults = async (req, res) => {
  try {
    const { userId, _id } = req.user;

    const student = await Student.findOne({ userId: userId || _id });
    if (!student) {
      return res.json({ results: [] });
    }

    const results = await Result.find({ 
      studentId: student._id,
      isDraft: false
    })
      .populate({
        path: 'examinationId',
        match: { status: 'public' }
      })
      .sort({ createdAt: -1 });

    const filteredResults = results.filter(r => r.examinationId);

    res.json({ results: filteredResults });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching results', error: error.message });
  }
};

export const getExaminationResults = async (req, res) => {
  try {
    const { examinationId } = req.params;
    const results = await Result.find({ examinationId })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .sort({ totalMarksObtained: -1 });

    const totalResults = results.length;
    const passed = results.filter(r => r.overallStatus === 'Pass').length;
    const failed = results.filter(r => r.overallStatus === 'Fail').length;
    const averagePercentage = results.reduce((sum, r) => sum + parseFloat(r.percentage || 0), 0) / totalResults || 0;

    res.json({
      results,
      statistics: {
        totalResults,
        passed,
        failed,
        passPercentage: totalResults > 0 ? ((passed / totalResults) * 100).toFixed(2) : 0,
        averagePercentage: averagePercentage.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching examination results', error: error.message });
  }
};

export const updateExaminationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'public', 'private'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const examination = await Examination.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!examination) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    res.json({ message: 'Status updated successfully', examination });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
};

export const publishResult = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Result.findByIdAndUpdate(
      id,
      { isDraft: false, publishedAt: new Date() },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    res.json({ message: 'Result published successfully', result });
  } catch (error) {
    res.status(500).json({ message: 'Error publishing result', error: error.message });
  }
};

export const getMyExamSchedule = async (req, res) => {
  try {
    const { schoolId, userId, _id } = req.user;

    const student = await Student.findOne({ userId: userId || _id });
    if (!student) {
      return res.json({ examinations: [] });
    }

    const examinations = await Examination.find({
      schoolId,
      class: student.class,
      sections: student.section,
      status: 'public'
    })
      .populate('createdBy', 'firstName lastName')
      .sort({ date: 1 });

    res.json({ examinations });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exam schedule', error: error.message });
  }
};

export const generateAdmitCard = async (req, res) => {
  try {
    const { schoolId, userId, _id } = req.user;
    const { examinationId } = req.params;

    // Find student
    const student = await Student.findOne({ userId: userId || _id })
      .populate('userId', 'firstName lastName email')
      .populate('schoolId', 'name address phone email');
    
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    // Check fees
    const Fee = (await import('../models/Fee.js')).default;
    const pendingFees = await Fee.find({
      schoolId,
      studentId: student._id,
      status: 'pending'
    });

    if (pendingFees.length > 0) {
      const totalPending = pendingFees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);
      return res.status(403).json({ 
        message: 'Cannot generate admit card. Please clear all pending fees.',
        pendingAmount: totalPending,
        pendingFees: pendingFees.length
      });
    }

    // Get examination
    const examination = await Examination.findById(examinationId)
      .populate('schoolId', 'name address phone email logo');
    
    if (!examination) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    // Check if exam is for student's class
    if (examination.class !== student.class || !examination.sections.includes(student.section)) {
      return res.status(403).json({ message: 'This examination is not for your class' });
    }

    // Generate admit card data
    const admitCard = {
      student: {
        name: `${student.userId.firstName} ${student.userId.lastName}`,
        rollNumber: student.rollNumber,
        class: student.class,
        section: student.section,
        admissionNumber: student.admissionNumber,
        email: student.userId.email
      },
      examination: {
        title: examination.title,
        code: examination.code,
        type: examination.type,
        date: examination.date,
        startAt: examination.startAt,
        durationMinutes: examination.durationMinutes,
        venue: examination.venue,
        subjects: examination.subjects,
        totalMarks: examination.totalMarks
      },
      school: {
        name: examination.schoolId.name,
        address: examination.schoolId.address,
        phone: examination.schoolId.phone,
        email: examination.schoolId.email
      },
      generatedAt: new Date(),
      admitCardNumber: `AC-${examination.code}-${student.rollNumber}-${Date.now()}`
    };

    res.json({ admitCard });
  } catch (error) {
    console.error('Generate admit card error:', error);
    res.status(500).json({ message: 'Error generating admit card', error: error.message });
  }
};

export const checkAdmitCardEligibility = async (req, res) => {
  try {
    const { schoolId, userId, _id } = req.user;

    const student = await Student.findOne({ userId: userId || _id });
    if (!student) {
      return res.json({ eligible: false, message: 'Student record not found' });
    }

    // Check pending fees
    const Fee = (await import('../models/Fee.js')).default;
    const pendingFees = await Fee.find({
      schoolId,
      studentId: student._id,
      status: 'pending'
    });

    if (pendingFees.length > 0) {
      const totalPending = pendingFees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);
      return res.json({ 
        eligible: false, 
        message: `You have pending fees of ₹${totalPending}. Please clear all fees to download admit card.`,
        pendingAmount: totalPending,
        pendingFees: pendingFees.length
      });
    }

    res.json({ eligible: true, message: 'You are eligible to download admit card' });
  } catch (error) {
    res.status(500).json({ message: 'Error checking eligibility', error: error.message });
  }
};

export const printResultCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user;

    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    const student = await Student.findById(result.studentId)
      .populate('userId', 'firstName lastName');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get result card template
    const Template = (await import('../models/Template.js')).default;
    const template = await Template.findOne({
      schoolId,
      type: 'RESULT_CARD',
      isDefault: true
    });

    if (!template) {
      return res.status(404).json({ message: 'No result card template found' });
    }

    // Get school data
    const School = (await import('../models/School.js')).default;
    const school = await School.findById(schoolId);

    // Get examination data
    const exam = await Examination.findById(result.examinationId);

    // Generate subject rows HTML
    const subjectRows = result.subjectResults?.map(subject => 
      `<tr>
        <td>${subject.subjectName}</td>
        <td>${subject.maxMarks}</td>
        <td>${subject.marksObtained}</td>
        <td>${subject.grade}</td>
        <td>${subject.status}</td>
      </tr>`
    ).join('') || '';

    // Prepare result card data matching template placeholders
    const resultCardData = {
      schoolName: school?.name || 'School Name',
      schoolAddress: school?.address ? `${school.address.street}, ${school.address.city}, ${school.address.state} - ${school.address.pincode}` : 'School Address',
      studentName: student.userId ? `${student.userId.firstName} ${student.userId.lastName}` : 'Student Name',
      rollNumber: student.rollNumber || 'N/A',
      className: `${student.class || 'N/A'} ${student.section || ''}`.trim(),
      examinationTitle: exam?.title || 'Examination',
      examinationDate: exam?.date ? new Date(exam.date).toLocaleDateString() : 'N/A',
      subjectRows: subjectRows,
      totalMaxMarks: result.totalMaxMarks || 0,
      totalMarksObtained: result.totalMarksObtained || 0,
      percentage: result.percentage || 0,
      overallGrade: result.overallGrade || 'N/A',
      overallStatus: result.overallStatus || 'N/A'
    };

    const TemplateCompiler = (await import('../utils/templateCompiler.js')).default;
    const compiledHtml = TemplateCompiler.replaceVariables(template.html, resultCardData);
    const pdfBase64 = await TemplateCompiler.generatePDF(compiledHtml, template.css);

    res.json({
      success: true,
      data: {
        pdf: pdfBase64,
        html: compiledHtml
      }
    });
  } catch (error) {
    console.error('Print result card error:', error);
    res.status(500).json({ message: 'Error generating result card', error: error.message });
  }
};
