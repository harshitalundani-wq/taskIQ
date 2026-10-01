import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../config/db.js';
import User from '../models/User.js';

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@taskiq.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'System Admin';
    const adminPhone = process.env.ADMIN_PHONE || '9876543210';

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });

    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`Updated existing user ${adminEmail} to admin role.`);
      } else {
        console.log(`Admin account (${adminEmail}) already exists.`);
      }
    } else {
      await User.create({
        name: adminName,
        email: adminEmail.toLowerCase(),
        phone: adminPhone,
        password: adminPassword,
        role: 'admin',
        skills: ['Management', 'Coordination'],
        interests: ['Event Operations'],
        points: 100,
      });

      console.log(`Admin account created successfully!`);
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
