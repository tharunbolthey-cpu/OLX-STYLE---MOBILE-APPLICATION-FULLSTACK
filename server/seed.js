require('dotenv').config();
const connectDB = require('./config/db');
const Category = require('./models/Category');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const categories = [
  ['Mobiles', 'phone-portrait-outline', ['Smartphones', 'Android Phones', 'iPhones', 'Tablets', 'Accessories']],
  ['Electronics', 'hardware-chip-outline', ['TV', 'Laptops', 'Cameras', 'Audio', 'Gaming']],
  ['Vehicles', 'car-outline', ['Cars', 'Bikes', 'Scooters', 'Commercial Vehicles']],
  ['Properties', 'home-outline', ['For Sale', 'For Rent', 'Land', 'Commercial']],
  ['Furniture', 'bed-outline', ['Sofa', 'Beds', 'Tables', 'Storage']],
  ['Fashion', 'shirt-outline', ['Men', 'Women', 'Kids', 'Accessories']],
  ['Jobs', 'briefcase-outline', ['IT', 'Sales', 'Education', 'Other']],
  ['Books', 'book-outline', ['Academic', 'Competitive Exams', 'Fiction']],
  ['Sports', 'barbell-outline', ['Fitness', 'Cricket', 'Football']],
  ['Pets', 'paw-outline', ['Dogs', 'Cats', 'Birds', 'Accessories']],
  ['Services', 'construct-outline', ['Repair', 'Tutors', 'Beauty', 'Other']],
  ['Others', 'pricetag-outline', ['Miscellaneous']]
];

(async () => {
  try {
    await connectDB();
    await Category.deleteMany({});
    await Category.insertMany(categories.map(([name, icon, subcategories]) => ({ name, icon, subcategories })));

    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (email && password && !(await User.exists({ email }))) {
      await User.create({
        name: 'Marketplace Admin',
        email,
        phone: process.env.ADMIN_PHONE || '0000000000',
        password: await bcrypt.hash(password, 12),
        role: 'admin'
      });
      console.log(`Admin user seeded: ${email}`);
    }

    console.log(`Seed complete: ${categories.length} categories`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
})();
