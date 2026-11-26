require('dotenv').config();

const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

const ADMIN = {
  name: 'Tharun Bolthey',
  email: 'admin@marketly.com',
  phone: '9999999999',
  password: 'Admin@12345',
};

async function seedAdmin() {
  try {
    await connectDB();

    const existingUser = await User.findOne({
      email: ADMIN.email.toLowerCase(),
    }).select('+password');

    if (existingUser) {
      existingUser.name = ADMIN.name;
      existingUser.phone = ADMIN.phone;
      existingUser.role = 'admin';
      existingUser.status = 'active';
      existingUser.password = await bcrypt.hash(ADMIN.password, 12);

      await existingUser.save();

      console.log('Admin account updated successfully.');
      console.log(`Email: ${ADMIN.email}`);
      console.log(`Password: ${ADMIN.password}`);

      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(ADMIN.password, 12);

    const admin = await User.create({
      name: ADMIN.name,
      email: ADMIN.email.toLowerCase(),
      phone: ADMIN.phone,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    console.log('Admin account created successfully.');
    console.log(`ID: ${admin._id}`);
    console.log(`Email: ${ADMIN.email}`);
    console.log(`Password: ${ADMIN.password}`);

    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin:', error);
    process.exit(1);
  }
}

seedAdmin();