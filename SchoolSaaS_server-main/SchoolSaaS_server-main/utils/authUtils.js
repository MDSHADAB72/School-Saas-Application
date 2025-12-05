import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password) => {
  return bcryptjs.hash(password, 10);
};

export const comparePassword = async (password, hashedPassword) => {
  return bcryptjs.compare(password, hashedPassword);
};

export const generateToken = (userId, role, schoolId) => {
  return jwt.sign(
    { userId, role, schoolId },
    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
  } catch (error) {
    return null;
  }
};

export const generateRandomString = (length = 10) => {
  return Math.random().toString(36).substring(2, length + 2);
};
