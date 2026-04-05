require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User } = require('./models');

async function resetAdminPassword() {
  try {
    await sequelize.authenticate();

    const email = 'admin@gmail.com';
    const newPassword = 'admin123';           // ← you can change this

    const hash = await bcrypt.hash(newPassword, 10);

    const [updated] = await User.update(
      { passwordHash: hash },
      { where: { email } }
    );

    if (updated === 0) {
      console.log(`No user found with email: ${email}`);
    } else {
      console.log('Password reset successfully!');
      console.log('Email:    ', email);
      console.log('New password: ', newPassword);
      console.log('Now go to login page and use these credentials.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

resetAdminPassword();