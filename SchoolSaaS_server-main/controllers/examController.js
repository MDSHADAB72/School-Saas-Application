import Exam from '../models/Exam.js';
import ExamSubject from '../models/ExamSubject.js';

export const createExam = async (req, res) => {
  try {
    const { name, category, academicYear, classes, description, dates } = req.body;
    
    const exam = new Exam({
      schoolId: req.user.schoolId,
      name,
      category,
      academicYear,
      classes,
      description,
      dates,
      createdBy: req.user.userId
    });

    await exam.save();
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find({ schoolId: req.user.schoolId })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');
    
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const subjects = await ExamSubject.find({ examId: exam._id });
    
    res.json({ success: true, data: { exam, subjects } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    
    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExamStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    
    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addExamSubject = async (req, res) => {
  try {
    const { className, subjectName, totalMarks, passingMarks, evaluator, setter, moderator, externalExaminer } = req.body;
    
    const subject = new ExamSubject({
      examId: req.params.id,
      className,
      subjectName,
      totalMarks,
      passingMarks,
      evaluator,
      setter,
      moderator,
      externalExaminer
    });

    await subject.save();
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExamSubjects = async (req, res) => {
  try {
    const subjects = await ExamSubject.find({ examId: req.params.id });
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};