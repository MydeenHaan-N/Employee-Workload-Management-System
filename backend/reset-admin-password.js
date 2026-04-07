import 'dotenv/config';
import bcrypt from 'bcrypt';
import { sequelize, User } from './models/index.js';

const resetAdminPassword = async () => {
  try {
    await sequelize.authenticate();

    const email = 'admin@gmail.com';
    const newPassword = '123456';
    const passwordHash = bcrypt.hashSync(newPassword, 10);

    const [updatedCount] = await User.update(
      { passwordHash },
      { where: { email } }
    );

    if (updatedCount === 0) {
      console.log(`No user found with email ${email}`);
      return;
    }

    console.log(`Password reset successfully for ${email}`);
  } catch (error) {
    console.error('Failed to reset password:', error);
  } finally {
    await sequelize.close();
  }
};

resetAdminPassword();
