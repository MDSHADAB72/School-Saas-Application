import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixTimetableIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('periodconfigurations');

    // Drop the old problematic index
    try {
      await collection.dropIndex('schoolId_1_academicYear_1_isActive_1');
      console.log('✓ Dropped old index: schoolId_1_academicYear_1_isActive_1');
    } catch (error) {
      console.log('Index may not exist or already dropped:', error.message);
    }

    // Create the new correct index
    await collection.createIndex(
      { schoolId: 1, academicYear: 1, class: 1, section: 1, isActive: 1 },
      { 
        unique: true,
        partialFilterExpression: { isActive: true },
        name: 'schoolId_1_academicYear_1_class_1_section_1_isActive_1'
      }
    );
    console.log('✓ Created new index: schoolId_1_academicYear_1_class_1_section_1_isActive_1');

    console.log('\n✓ Timetable index fixed successfully!');
    console.log('You can now create multiple period configurations for different classes.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing index:', error);
    process.exit(1);
  }
};

fixTimetableIndex();
