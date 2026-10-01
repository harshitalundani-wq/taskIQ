import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const createAdmin = async () => {
  try {
    await connectDB();

    const adminName = process.env.ADMIN_NAME || 'System Admin';
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@taskiq.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('Error: ADMIN_PASSWORD is not set in environment variables (.env).');
      process.exit(1);
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log(`[ADMIN SETUP] Existing user (${adminEmail}) was upgraded to admin role.`);
      } else {
        console.log(`[ADMIN SETUP] Admin account (${adminEmail}) already exists.`);
      }
      process.exit(0);
    }

    // Create new admin user (password is automatically hashed via User schema pre-save hook)
    const admin = await User.create({
      name: adminName.trim(),
      email: adminEmail,
      phone: process.env.ADMIN_PHONE || '9876543210',
      password: adminPassword,
      role: 'admin',
      skills: ['Administration', 'Event Management'],
      interests: ['Operations', 'Coordination'],
      points: 100,
    });

    console.log('[ADMIN SETUP] Admin user created successfully.');
    console.log(`Name:  ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role:  ${admin.role}`);
    console.log('Password is secure and bcrypt hashed in MongoDB.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[ADMIN SETUP ERROR]: ${error.message}`);
    process.exit(1);
  }
};

createAdmin();
