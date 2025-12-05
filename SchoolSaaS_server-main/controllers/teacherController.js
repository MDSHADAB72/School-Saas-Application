import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const getAllTeachers = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { page = 1, limit = 10, subject } = req.query;
    const skip = (page - 1) * limit;

    // Validate schoolId
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required. User must be associated with a school.' });
    }

    let filter = { schoolId };
    if (subject) filter.subject = subject;

    const teachers = await Teacher.find(filter)
      .populate('userId', 'firstName lastName email phoneNumber')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Teacher.countDocuments(filter);

    res.json({
      teachers,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teachers', error: error.message });
  }
};

export const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('userId', 'firstName lastName email phoneNumber');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json({ teacher });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher', error: error.message });
  }
};

export const createTeacher = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { employeeId, qualification, subject, classesAssigned, sectionsAssigned, dateOfJoining, experience, firstName, lastName, email, phoneNumber } = req.body;

    // Validate schoolId
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required. User must be associated with a school.' });
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !employeeId || !subject) {
      return res.status(400).json({ message: 'Missing required fields: firstName, lastName, email, employeeId, subject' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Create new user for the teacher
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      user = new User({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'teacher',
        schoolId,
        phoneNumber: phoneNumber || '',
        active: true
      });
      await user.save();
    }

    // Create teacher record
    const teacher = new Teacher({
      schoolId,
      userId: user._id,
      employeeId,
      qualification,
      subject,
      classesAssigned: classesAssigned || [],
      sectionsAssigned: sectionsAssigned || [],
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
      experience: experience || 0
    });

    await teacher.save();
    
    // Populate user data in response
    await teacher.populate('userId');
    
    res.status(201).json({ message: 'Teacher created successfully', teacher });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ message: 'Error creating teacher', error: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, ...teacherData } = req.body;
    
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Update user data if provided
    if (firstName || lastName || email || phoneNumber) {
      await User.findByIdAndUpdate(teacher.userId, {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email: email.toLowerCase() }),
        ...(phoneNumber && { phoneNumber })
      });
    }

    // Update teacher data
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      teacherData,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email phoneNumber');

    res.json({ message: 'Teacher updated successfully', teacher: updatedTeacher });
  } catch (error) {
    res.status(500).json({ message: 'Error updating teacher', error: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting teacher', error: error.message });
  }
};

export const bulkCreateTeachers = async (req, res) => {
  try {
    const { teachers } = req.body;
    const schoolId = req.user.schoolId;
    
    if (!teachers || !Array.isArray(teachers)) {
      return res.status(400).json({ message: 'Teachers array is required' });
    }

    const createdTeachers = [];
    const errors = [];

    for (let i = 0; i < teachers.length; i++) {
      try {
        const teacherData = teachers[i];
        
        const existingTeacher = await Teacher.findOne({ schoolId, employeeId: teacherData.employeeId });
        if (existingTeacher) {
          errors.push(`Row ${i + 1}: Teacher with employee ID ${teacherData.employeeId} already exists`);
          continue;
        }

        let user = await User.findOne({ email: teacherData.email?.toLowerCase() });
        if (!user && teacherData.email) {
          const hashedPassword = await bcrypt.hash('teacher123', 10);
          user = new User({
            firstName: teacherData.firstName,
            lastName: teacherData.lastName,
            email: teacherData.email.toLowerCase(),
            password: hashedPassword,
            role: 'teacher',
            schoolId,
            phoneNumber: teacherData.phoneNumber || '',
            active: true
          });
          await user.save();
        }

        const teacher = new Teacher({
          schoolId,
          userId: user?._id,
          employeeId: teacherData.employeeId,
          qualification: teacherData.qualification,
          subject: teacherData.subject,
          experience: teacherData.experience || 0,
          dateOfJoining: new Date()
        });

        await teacher.save();
        createdTeachers.push(teacher);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    res.status(201).json({
      message: 'Bulk upload completed',
      count: createdTeachers.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk create teachers error:', error);
    res.status(500).json({ message: 'Failed to create teachers', error: error.message });
  }
};
