import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import School from '../models/School.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Attendance from '../models/Attendance.js';
import Examination from '../models/Examination.js';
import Result from '../models/Result.js';
import Fee from '../models/Fee.js';
import Announcement from '../models/Announcement.js';
import { hashPassword } from '../utils/authUtils.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management-saas');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await School.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Attendance.deleteMany({});
    await Examination.deleteMany({});
    await Result.deleteMany({});
    await Fee.deleteMany({});
    await Announcement.deleteMany({});

    // Create Super Admin
    const superAdmin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@saas.com',
      password: await hashPassword('password123'),
      role: 'super_admin',
      phoneNumber: '9876543210'
    });
    console.log('Super Admin created');

    // Create Schools
    const school1 = await School.create({
      name: 'Delhi Public School',
      type: 'private',
      establishedYear: 1995,
      board: 'cbse',
      email: 'dps@school.com',
      phoneNumber: '9876543210',
      address: {
        street: '123 Main Street',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India'
      },
      principalName: 'Dr. Rajesh Kumar',
      registrationNumber: 'CBSE001',
      subscription: {
        plan: 'professional',
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-01-01')
      },
      totalStudents: 500,
      totalTeachers: 50,
      totalClasses: 12
    });

    const school2 = await School.create({
      name: 'Central School',
      type: 'public',
      establishedYear: 1988,
      board: 'icse',
      email: 'central@school.com',
      phoneNumber: '9876543211',
      address: {
        street: '456 Second Avenue',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      principalName: 'Mrs. Priya Singh',
      registrationNumber: 'ICSE001',
      subscription: {
        plan: 'starter',
        status: 'active',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-02-01')
      },
      totalStudents: 300,
      totalTeachers: 30,
      totalClasses: 10
    });

    console.log('Schools created');

    // Create Users for School 1
    const schoolAdmin1 = await User.create({
      firstName: 'Rajesh',
      lastName: 'Kumar',
      email: 'admin@dps.com',
      password: await hashPassword('password123'),
      role: 'school_admin',
      schoolId: school1._id,
      phoneNumber: '9876543200'
    });

    const teacher1 = await User.create({
      firstName: 'Amit',
      lastName: 'Sharma',
      email: 'amit@dps.com',
      password: await hashPassword('password123'),
      role: 'teacher',
      schoolId: school1._id,
      phoneNumber: '9876543201'
    });

    const teacher2 = await User.create({
      firstName: 'Sneha',
      lastName: 'Patel',
      email: 'sneha@dps.com',
      password: await hashPassword('password123'),
      role: 'teacher',
      schoolId: school1._id,
      phoneNumber: '9876543202'
    });

    const student1 = await User.create({
      firstName: 'Arjun',
      lastName: 'Nair',
      email: 'arjun@student.com',
      password: await hashPassword('password123'),
      role: 'student',
      schoolId: school1._id,
      phoneNumber: '9876543203'
    });

    const student2 = await User.create({
      firstName: 'Aisha',
      lastName: 'Khan',
      email: 'aisha@student.com',
      password: await hashPassword('password123'),
      role: 'student',
      schoolId: school1._id,
      phoneNumber: '9876543204'
    });

    const parent1 = await User.create({
      firstName: 'Vikram',
      lastName: 'Nair',
      email: 'vikram@parent.com',
      password: await hashPassword('password123'),
      role: 'parent',
      schoolId: school1._id,
      phoneNumber: '9876543205'
    });

    console.log('Users created');

    // Create Teachers
    const teacherRec1 = await Teacher.create({
      schoolId: school1._id,
      userId: teacher1._id,
      employeeId: 'EMP001',
      qualification: 'B.Tech, M.Ed',
      subject: 'Mathematics',
      classesAssigned: ['10', '11'],
      sectionsAssigned: ['A', 'B'],
      dateOfJoining: new Date('2020-06-15'),
      experience: 4
    });

    const teacherRec2 = await Teacher.create({
      schoolId: school1._id,
      userId: teacher2._id,
      employeeId: 'EMP002',
      qualification: 'B.Sc, B.Ed',
      subject: 'English',
      classesAssigned: ['9', '10'],
      sectionsAssigned: ['A', 'B', 'C'],
      dateOfJoining: new Date('2019-07-20'),
      experience: 5
    });

    console.log('Teachers created');

    // Create Students
    const studentRec1 = await Student.create({
      schoolId: school1._id,
      userId: student1._id,
      rollNumber: '001',
      class: '10',
      section: 'A',
      parentEmail: 'vikram@parent.com',
      parentPhone: '9876543205',
      dateOfBirth: new Date('2008-03-15'),
      gender: 'Male',
      bloodGroup: 'O+',
      address: '789 Student Lane',
      admissionNumber: 'ADM001',
      admissionDate: new Date('2020-06-01')
    });

    const studentRec2 = await Student.create({
      schoolId: school1._id,
      userId: student2._id,
      rollNumber: '002',
      class: '10',
      section: 'A',
      parentEmail: 'parent@email.com',
      parentPhone: '9876543206',
      dateOfBirth: new Date('2008-05-20'),
      gender: 'Female',
      bloodGroup: 'A+',
      address: '456 School Road',
      admissionNumber: 'ADM002',
      admissionDate: new Date('2020-06-01')
    });

    console.log('Students created');

    // Create Attendance Records
    const today = new Date();
    for (let i = 0; i < 20; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await Attendance.create({
        schoolId: school1._id,
        studentId: studentRec1._id,
        class: '10',
        section: 'A',
        date,
        status: Math.random() > 0.2 ? 'Present' : 'Absent',
        markedBy: teacher1._id
      });
    }

    console.log('Attendance records created');

    // Create Examinations
    const exam1 = await Examination.create({
      schoolId: school1._id,
      examName: 'Mid Term Examination',
      examType: 'Mid Term',
      class: '10',
      section: 'A',
      subject: 'Mathematics',
      totalMarks: 100,
      passingMarks: 35,
      examDate: new Date('2024-12-15'),
      duration: 120,
      description: 'Mid term exam for Mathematics'
    });

    const exam2 = await Examination.create({
      schoolId: school1._id,
      examName: 'Unit Test 1',
      examType: 'Unit Test',
      class: '10',
      section: 'A',
      subject: 'English',
      totalMarks: 50,
      passingMarks: 17,
      examDate: new Date('2024-12-10'),
      duration: 60,
      description: 'Unit test for English'
    });

    console.log('Examinations created');

    // Create Results
    await Result.create({
      schoolId: school1._id,
      examinationId: exam1._id,
      studentId: studentRec1._id,
      marksObtained: 85,
      grade: 'A',
      status: 'Pass',
      remarks: 'Excellent performance'
    });

    await Result.create({
      schoolId: school1._id,
      examinationId: exam2._id,
      studentId: studentRec1._id,
      marksObtained: 42,
      grade: 'B',
      status: 'Pass',
      remarks: 'Good work'
    });

    console.log('Results created');

    // Create Fees
    await Fee.create({
      schoolId: school1._id,
      studentId: studentRec1._id,
      class: '10',
      section: 'A',
      feeMonth: 'December 2024',
      amount: 5000,
      feeType: 'Tuition',
      status: 'Paid',
      dueDate: new Date('2024-12-05'),
      paidDate: new Date('2024-12-03'),
      paidAmount: 5000,
      paymentMethod: 'Online Transfer',
      transactionId: 'TXN123456',
      receiptNumber: 'REC001'
    });

    await Fee.create({
      schoolId: school1._id,
      studentId: studentRec2._id,
      class: '10',
      section: 'A',
      feeMonth: 'December 2024',
      amount: 5000,
      feeType: 'Tuition',
      status: 'Pending',
      dueDate: new Date('2024-12-05'),
      paidAmount: 0
    });

    console.log('Fees created');

    // Create Announcements
    await Announcement.create({
      schoolId: school1._id,
      title: 'Winter Vacation Notice',
      description: 'Winter vacation starts from December 20, 2024',
      content: 'Dear parents and students, winter vacation will start from December 20 and continue till January 10, 2025.',
      audience: 'All',
      priority: 'High',
      publishedBy: schoolAdmin1._id,
      publishDate: new Date(),
      active: true
    });

    await Announcement.create({
      schoolId: school1._id,
      title: 'Mathematics Assignment Due',
      description: 'Complete the assignment on Algebra by December 15',
      content: 'Students of class 10, please complete the algebra assignment from chapter 4.',
      audience: 'Class Specific',
      class: '10',
      section: 'A',
      priority: 'Medium',
      publishedBy: teacher1._id,
      publishDate: new Date(),
      active: true
    });

    console.log('Announcements created');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

connectDB().then(seedDatabase);
