import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management-saas';

async function fixIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Drop existing indexes if they exist
    try {
      await db.collection('schools').dropIndex('email_1');
      console.log('Dropped existing email index');
    } catch (error) {
      console.log('Email index not found or already dropped');
    }
    
    try {
      await db.collection('schools').dropIndex('registrationNumber_1');
      console.log('Dropped existing registrationNumber index');
    } catch (error) {
      console.log('RegistrationNumber index not found or already dropped');
    }
    
    // Clear any existing schools with null values
    await db.collection('schools').deleteMany({ $or: [{ email: null }, { registrationNumber: null }] });
    console.log('Cleared schools with null values');
    
    console.log('Index fix completed');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing index:', error);
    process.exit(1);
  }
}

fixIndex();