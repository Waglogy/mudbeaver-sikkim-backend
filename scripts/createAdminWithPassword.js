require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Generate a complex random password
function generateComplexPassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly (total length 16)
  for (let i = password.length; i < 16; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mudbeaver';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    console.log('✅ Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mudbeaversikkim.in';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: adminEmail,
      role: 'admin'
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('\n💡 If you want to reset the password, delete the user first or update it manually.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Generate complex password
    const complexPassword = generateComplexPassword();

    // Create admin user
    const adminData = {
      email: adminEmail,
      password: complexPassword,
      role: 'admin',
      name: 'Admin'
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('\n🎉 Admin user created successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📧 EMAIL:    ', admin.email);
    console.log('🔐 PASSWORD: ', complexPassword);
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT: Save these credentials in a secure place!');
    console.log('🔗 Login URL: http://localhost:3000/admin/login\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Make sure MongoDB is running on your system!');
    }
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();