#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { comparePassword } from './utils/authUtils.js';

dotenv.config();

const verifyDemoAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management-saas');
    console.log('✅ MongoDB connected\n');

    const demoAccounts = [
      { email: 'superadmin@saas.com', password: 'password123', role: 'super_admin' },
      { email: 'admin@dps.com', password: 'password123', role: 'school_admin' },
      { email: 'amit@dps.com', password: 'password123', role: 'teacher' },
      { email: 'arjun@student.com', password: 'password123', role: 'student' },
      { email: 'vikram@parent.com', password: 'password123', role: 'parent' },
    ];

    console.log('🔐 Verifying Demo Accounts\n');
    console.log('━'.repeat(80));

    let allValid = true;

    for (const account of demoAccounts) {
      const user = await User.findOne({ email: account.email.toLowerCase() });
      
      if (!user) {
        console.log(`❌ ${account.email.padEnd(25)} - NOT FOUND`);
        allValid = false;
        continue;
      }

      const isPasswordValid = await comparePassword(account.password, user.password);
      const isActive = user.active !== false;
      const hasCorrectRole = user.role === account.role;
      const isValid = isPasswordValid && isActive && hasCorrectRole;

      if (isValid) {
        console.log(`✅ ${account.email.padEnd(25)} - OK (${user.role})`);
      } else {
        console.log(`❌ ${account.email.padEnd(25)} - FAILED`);
        if (!isPasswordValid) console.log(`   └─ Invalid password hash`);
        if (!isActive) console.log(`   └─ Account inactive`);
        if (!hasCorrectRole) console.log(`   └─ Wrong role: ${user.role}`);
        allValid = false;
      }
    }

    console.log('━'.repeat(80));

    if (allValid) {
      console.log('\n✅ All demo accounts verified successfully!\n');
      console.log('You can now login with any of these accounts:\n');
      for (const account of demoAccounts) {
        console.log(`  • ${account.email} / ${account.password}`);
      }
    } else {
      console.log('\n❌ Some accounts have issues. Run:');
      console.log('   node resetDatabase.js');
      console.log('   npm run seed\n');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

verifyDemoAccounts();
