import User from './models/User.js';

export const seedAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn('WARNING: ADMIN_EMAIL or ADMIN_PASSWORD not specified in environment variables. Skipping admin seeding.');
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingAdmin) {
      console.log('Admin user already exists in database.');
      return;
    }

    const admin = new User({
      email: adminEmail,
      password: adminPassword, // Pre-save hook hashes this password automatically
    });

    await admin.save();
    console.log(`Admin user seeded successfully with email: ${adminEmail}`);
  } catch (error) {
    console.error(`Error seeding admin user: ${error.message}`);
  }
};
