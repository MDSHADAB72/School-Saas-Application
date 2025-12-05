import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import School from './models/School.js';

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

const fixSchoolAdmin = async () => {
  try {
    console.log('\n=== Fixing School Admin Account ===\n');

    // Get school admin
    const schoolAdmin = await User.findOne({ email: 'admin@dps.com' });
    if (!schoolAdmin) {
      console.log('❌ School Admin not found. Run seed script first.');
      return;
    }

    console.log(`Found School Admin: ${schoolAdmin.firstName} ${schoolAdmin.lastName}`);
    console.log(`Current schoolId: ${schoolAdmin.schoolId}`);

    // Get first school
    const school = await School.findOne({ name: 'Delhi Public School' });
    if (!school) {
      console.log('❌ School not found. Run seed script first.');
      return;
    }

    console.log(`Found School: ${school.name}`);

    // Update school admin with schoolId if missing
    if (!schoolAdmin.schoolId) {
      schoolAdmin.schoolId = school._id;
      await schoolAdmin.save();
      console.log(`✅ Updated schoolId to: ${schoolAdmin.schoolId}`);
    } else {
      console.log(`✅ schoolId already set correctly`);
    }

    // Verify all school admins have schoolIds
    console.log('\n=== Verifying All School Admins ===\n');
    const allAdmins = await User.find({ role: 'school_admin' }).populate('schoolId');
    
    for (const admin of allAdmins) {
      if (admin.schoolId) {
        console.log(`✅ ${admin.email} → School: ${admin.schoolId.name}`);
      } else {
        console.log(`❌ ${admin.email} → NO SCHOOL ASSIGNED`);
      }
    }

    console.log('\n=== Fix Complete ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB().then(fixSchoolAdmin);
