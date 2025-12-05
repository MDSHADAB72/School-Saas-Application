import User from '../models/User.js';
import School from '../models/School.js';
import { hashPassword, comparePassword, generateToken } from '../utils/authUtils.js';

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, schoolId, phoneNumber } = req.body;

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Verify school exists (if not super_admin)
    if (role !== 'super_admin' && schoolId) {
      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(400).json({ message: 'School not found' });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      schoolId: role === 'super_admin' ? null : schoolId,
      phoneNumber,
      active: true
    });

    await user.save();

    const token = generateToken(user._id, user.role, user.schoolId);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user (case-insensitive email search)
    console.log('Looking for user with email:', email.toLowerCase());
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('Found user:', user ? 'Yes' : 'No');
    if (!user) {
      console.log(`Login failed: User not found with email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      console.log(`Login failed: Invalid password for user: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.active === false) {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    // Generate token
    const token = generateToken(user._id, user.role, user.schoolId);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, email, phoneNumber } = req.body;

    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email: email.toLowerCase() }),
        ...(phoneNumber && { phoneNumber })
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully', 
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        schoolId: updatedUser.schoolId,
        phoneNumber: updatedUser.phoneNumber,
        profilePhoto: updatedUser.profilePhoto
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
};

export const registerSchool = async (req, res) => {
  try {
    console.log('School registration request body:', req.body);
    
    const {
      schoolName,
      schoolType,
      establishedYear,
      board,
      adminName,
      adminEmail,
      adminPassword,
      adminPhone,
      address,
      city,
      state,
      pincode,
      country,
      plan
    } = req.body;

    // Validate required fields
    if (!schoolName || !schoolType || !establishedYear || !board || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if school admin email already exists
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Admin email already exists' });
    }

    // Check if school name already exists
    const existingSchool = await School.findOne({ name: schoolName });
    if (existingSchool) {
      return res.status(400).json({ message: 'School name already exists' });
    }

    // Create school
    const school = new School({
      name: schoolName,
      type: schoolType,
      establishedYear: parseInt(establishedYear),
      board,
      address: {
        street: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        country: country || 'India'
      },
      subscription: {
        plan: plan || 'starter',
        status: 'trial',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      active: true
    });

    console.log('Creating school with data:', school);
    const savedSchool = await school.save();
    console.log('School saved successfully:', savedSchool._id);

    // Hash admin password
    const hashedPassword = await hashPassword(adminPassword);

    // Create school admin user
    const nameParts = adminName.split(' ');
    const adminUser = new User({
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ') || 'Admin',
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: 'school_admin',
      schoolId: savedSchool._id,
      phoneNumber: adminPhone || '',
      active: true
    });

    console.log('Creating admin user with data:', adminUser);
    const savedUser = await adminUser.save();
    console.log('Admin user saved successfully:', savedUser._id);

    // Generate token for immediate login
    const token = generateToken(savedUser._id, savedUser.role, savedUser.schoolId);

    console.log('Registration completed successfully');
    console.log('Created user with email:', savedUser.email);
    
    res.status(201).json({
      success: true,
      message: 'School registered successfully',
      token,
      user: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        role: savedUser.role,
        schoolId: savedUser.schoolId
      },
      school: {
        id: savedSchool._id,
        name: savedSchool.name,
        type: savedSchool.type,
        plan: savedSchool.subscription.plan
      }
    });
  } catch (error) {
    console.error('School registration error:', error);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'School registration failed', error: error.message });
  }
};

export const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};
