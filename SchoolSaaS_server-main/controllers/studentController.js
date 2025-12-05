import Student from '../models/Student.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const getAllStudents = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { page = 1, limit = 10, class: className, section } = req.query;
    const skip = (page - 1) * limit;

    // Validate schoolId
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required. User must be associated with a school.' });
    }

    let filter = { schoolId };
    if (className) filter.class = className;
    if (section) filter.section = section;

    const students = await Student.find(filter)
      .populate('userId', 'firstName lastName email phoneNumber')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ class: 1, section: 1 });

    // Get fee status for each student
    const Fee = (await import('../models/Fee.js')).default;
    const studentsWithFees = await Promise.all(students.map(async (student) => {
      const pendingFees = await Fee.countDocuments({ 
        studentId: student._id, 
        status: { $in: ['Pending', 'Overdue'] } 
      });
      return {
        ...student.toObject(),
        feeStatus: pendingFees > 0 ? 'Unpaid' : 'Paid'
      };
    }));

    const total = await Student.countDocuments(filter);

    res.json({
      students: studentsWithFees,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
};

export const createStudent = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { rollNumber, class: className, section, firstName, lastName, email, dateOfBirth, gender, bloodGroup, address } = req.body;

    // Validate schoolId
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required. User must be associated with a school.' });
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !rollNumber || !className || !section) {
      return res.status(400).json({ message: 'Missing required fields: firstName, lastName, email, rollNumber, class, section' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Create new user for the student
      const hashedPassword = await bcrypt.hash('student123', 10);
      user = new User({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'student',
        schoolId,
        phoneNumber: '',
        active: true
      });
      await user.save();
    }

    // Generate sequential studentId
    const lastStudent = await Student.findOne({ schoolId }).sort({ createdAt: -1 });
    const studentCount = await Student.countDocuments({ schoolId });
    const studentId = `STU${String(studentCount + 1).padStart(5, '0')}`;

    // Create student record
    const student = new Student({
      schoolId,
      userId: user._id,
      studentId,
      rollNumber,
      class: className,
      section,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender,
      bloodGroup,
      address,
      admissionNumber: `ADM${Date.now()}`,
      admissionDate: new Date()
    });

    await student.save();
    
    // Auto-generate fee based on class
    const Fee = (await import('../models/Fee.js')).default;
    const classNumber = parseInt(className);
    const feeAmount = classNumber * 1000; // Class 1 = 1000, Class 2 = 2000, etc.
    
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    
    const fee = new Fee({
      schoolId,
      studentId: student._id,
      class: className,
      section,
      feeMonth: currentMonth,
      amount: feeAmount,
      feeType: 'Tuition',
      dueDate,
      status: 'Pending',
      notes: 'Auto-generated fee on student admission'
    });
    
    await fee.save();
    
    // Populate user data in response
    await student.populate('userId');
    
    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
};

export const bulkCreateStudents = async (req, res) => {
  try {
    const { students } = req.body;
    const schoolId = req.user.schoolId;
    
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ message: 'Students array is required' });
    }

    const createdStudents = [];
    const errors = [];

    for (let i = 0; i < students.length; i++) {
      try {
        const studentData = students[i];
        
        // Check for existing roll number
        const existingStudent = await Student.findOne({
          schoolId,
          rollNumber: studentData.rollNumber,
          class: studentData.class,
          section: studentData.section
        });

        if (existingStudent) {
          errors.push(`Row ${i + 1}: Student with roll number ${studentData.rollNumber} already exists`);
          continue;
        }

        // Create user if not exists
        let user = await User.findOne({ email: studentData.email?.toLowerCase() });
        if (!user && studentData.email) {
          const hashedPassword = await bcrypt.hash('student123', 10);
          user = new User({
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            email: studentData.email.toLowerCase(),
            password: hashedPassword,
            role: 'student',
            schoolId,
            active: true
          });
          await user.save();
        }

        // Generate sequential studentId
        const studentCount = await Student.countDocuments({ schoolId });
        const studentId = `STU${String(studentCount + i + 1).padStart(5, '0')}`;

        const student = new Student({
          schoolId,
          userId: user?._id,
          studentId,
          rollNumber: studentData.rollNumber,
          class: studentData.class,
          section: studentData.section,
          dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : null,
          gender: studentData.gender,
          address: studentData.address,
          parentEmail: studentData.parentEmail,
          parentPhone: studentData.parentPhone,
          admissionNumber: `ADM${Date.now()}${i}`,
          admissionDate: new Date()
        });

        await student.save();
        
        // Auto-generate fee based on class
        const Fee = (await import('../models/Fee.js')).default;
        const classNumber = parseInt(studentData.class);
        const feeAmount = classNumber * 1000;
        
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        
        const fee = new Fee({
          schoolId,
          studentId: student._id,
          class: studentData.class,
          section: studentData.section,
          feeMonth: currentMonth,
          amount: feeAmount,
          feeType: 'Tuition',
          dueDate,
          status: 'Pending',
          notes: 'Auto-generated fee on student admission'
        });
        
        await fee.save();
        
        createdStudents.push(student);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    res.status(201).json({
      message: 'Bulk upload completed',
      count: createdStudents.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk create students error:', error);
    res.status(500).json({ message: 'Failed to create students', error: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
};

export const generateAdmitCard = async (req, res) => {
  try {
    console.log('Generate admit card request for student ID:', req.params.id);
    const { id } = req.params;
    const { schoolId } = req.user;

    const student = await Student.findById(id)
      .populate('userId', 'firstName lastName');

    console.log('Student found:', !!student);
    console.log('Student details:', student ? {
      class: student.class,
      section: student.section,
      rollNumber: student.rollNumber,
      name: student.userId ? `${student.userId.firstName} ${student.userId.lastName}` : 'No name'
    } : 'No student');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find exam for this student's class and section
    let studentExam;
    try {
      const Examination = (await import('../models/Examination.js')).default;
      console.log('Looking for exam with schoolId:', schoolId, 'class:', student.class, 'section:', student.section);
      
      studentExam = await Examination.findOne({
        schoolId,
        class: student.class,
        $or: [
          { section: student.section },
          { section: { $exists: false } },
          { section: null },
          { section: '' }
        ]
      }).sort({ createdAt: -1 });
      
      console.log('Exam found:', !!studentExam);
      if (studentExam) {
        console.log('Exam details:', {
          title: studentExam.title,
          examName: studentExam.examName,
          class: studentExam.class,
          section: studentExam.section,
          subjects: studentExam.subjects ? studentExam.subjects.length : 0,
          singleSubject: studentExam.subject
        });
      }
    } catch (examError) {
      console.error('Error fetching exam:', examError);
      return res.status(500).json({ message: 'Error fetching exam data' });
    }

    if (!studentExam) {
      return res.status(404).json({ message: 'No exam found for this student\'s class and section' });
    }

    // Check fee payment status
    const Fee = (await import('../models/Fee.js')).default;
    const pendingFees = await Fee.countDocuments({
      studentId: student._id,
      status: { $in: ['Pending', 'Overdue'] }
    });

    console.log('Pending fees:', pendingFees);
    if (pendingFees > 0) {
      return res.status(400).json({ message: 'Student has pending fees. Please clear all dues before generating admit card.' });
    }

    // Get admit card template
    const Template = (await import('../models/Template.js')).default;
    const template = await Template.findOne({
      schoolId,
      type: 'ADMIT_CARD',
      isDefault: true
    });

    console.log('Template found:', !!template);
    if (template) {
      console.log('Template details:', {
        name: template.name,
        type: template.type,
        isDefault: template.isDefault,
        htmlLength: template.html ? template.html.length : 0
      });
    }
    if (!template) {
      return res.status(404).json({ message: 'No admit card template found' });
    }

    // Get school data
    const School = (await import('../models/School.js')).default;
    const school = await School.findById(schoolId);

    // Prepare admit card data
    const admitCardData = {
      school: {
        name: school?.name || 'School Name',
        address: school?.address ? 
          `${school.address.street || ''}, ${school.address.city || ''}, ${school.address.state || ''} ${school.address.pincode || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') 
          : 'School Address',
        phone: school?.phoneNumber || 'Phone',
        email: school?.email || 'Email',
        logo: school?.logo || '/uploads/default-logo.png'
      },
      student: {
        name: student.userId ? `${student.userId.firstName} ${student.userId.lastName}` : 'Student Name',
        class: student.class || 'N/A',
        section: student.section || 'N/A',
        rollNumber: student.rollNumber || 'N/A',
        admissionNumber: student.admissionNumber || 'N/A',
        fatherName: student.fatherName || 'N/A'
      },
      exam: {
        name: studentExam.title || studentExam.examName || 'Examination',
        type: studentExam.type || studentExam.examType || 'N/A',
        date: studentExam.date ? new Date(studentExam.date).toLocaleDateString() : 
              studentExam.examDate ? new Date(studentExam.examDate).toLocaleDateString() : 'N/A'
      },
      examSchedule: (() => {
        if (studentExam.subjects && studentExam.subjects.length > 0) {
          return studentExam.subjects.map(subject => ({
            subject: subject.name,
            date: studentExam.date ? new Date(studentExam.date).toLocaleDateString() : 
                  studentExam.examDate ? new Date(studentExam.examDate).toLocaleDateString() : 'N/A',
            time: studentExam.startAt ? new Date(studentExam.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            duration: studentExam.durationMinutes ? `${studentExam.durationMinutes} minutes` : 
                     studentExam.duration ? `${studentExam.duration} minutes` : 'N/A',
            maxMarks: subject.maxMarks || 0,
            passingMarks: subject.passingMarks || 0
          }));
        } else {
          return [{
            subject: studentExam.subject || 'General',
            date: studentExam.date ? new Date(studentExam.date).toLocaleDateString() : 
                  studentExam.examDate ? new Date(studentExam.examDate).toLocaleDateString() : 'N/A',
            time: studentExam.startAt ? new Date(studentExam.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            duration: studentExam.durationMinutes ? `${studentExam.durationMinutes} minutes` : 
                     studentExam.duration ? `${studentExam.duration} minutes` : 'N/A',
            maxMarks: studentExam.totalMarks || 0,
            passingMarks: studentExam.passingMarks || 0
          }];
        }
      })()
    };

    console.log('Admit card data prepared for student:', student.rollNumber, 'exam:', studentExam.examName || studentExam.title);
    console.log('Subjects found:', admitCardData.examSchedule.length);
    console.log('Full admit card data:', JSON.stringify(admitCardData, null, 2));

    const TemplateCompiler = (await import('../utils/templateCompiler.js')).default;
    console.log('Compiling template...');
    console.log('Template HTML preview:', template.html.substring(0, 200));
    const compiledHtml = TemplateCompiler.replaceVariables(template.html, admitCardData);
    console.log('Compiled HTML preview:', compiledHtml.substring(0, 300));
    console.log('Generating PDF...');
    const pdfBase64 = await TemplateCompiler.generatePDF(compiledHtml, template.css);
    console.log('PDF generated successfully, size:', pdfBase64.length);

    res.json({
      success: true,
      data: {
        pdf: pdfBase64,
        html: compiledHtml
      }
    });
  } catch (error) {
    console.error('Generate admit card error:', error);
    res.status(500).json({ message: 'Error generating admit card', error: error.message });
  }
};
