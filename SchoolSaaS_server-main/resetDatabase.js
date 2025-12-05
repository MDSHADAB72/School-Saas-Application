import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const resetDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management-saas');
    console.log('MongoDB connected');

    // Drop all collections
    await mongoose.connection.db.dropDatabase();
    console.log('✅ Database cleared successfully');

    await mongoose.connection.close();
    console.log('✅ Connection closed');
    console.log('\n🔄 Now run: npm run seed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetDatabase();
