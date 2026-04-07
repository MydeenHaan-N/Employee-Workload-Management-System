import bcrypt from 'bcrypt';
import { User, Role } from '../models/index.js';

const INITIAL_USERS = [
  {
    fullName: 'System Admin',
    email: 'admin@gmail.com',
    password: '123456',
    role: 'admin',
  },
  {
    fullName: 'Haan Manager',
    email: 'haan@gmail.com',
    password: '123456',
    role: 'manager',
  },
  {
    fullName: 'Mydeen Employee',
    email: 'mydeen@gamil.com',
    password: '123456',
    role: 'employee',
  },
];

const seedInitialUsers = async () => {
  for (const initialUser of INITIAL_USERS) {
    const roleRecord = await Role.findOne({ where: { name: initialUser.role } });
    if (!roleRecord) {
      throw new Error(`Role "${initialUser.role}" must exist before seeding users`);
    }

    const existingUser = await User.findOne({ where: { email: initialUser.email } });
    if (existingUser) {
      await existingUser.update({
        fullName: initialUser.fullName,
        roleId: roleRecord.id,
        managerId: roleRecord.name === 'employee' ? existingUser.managerId : null,
      });
      continue;
    }

    const passwordHash = bcrypt.hashSync(initialUser.password, 10);
    await User.create({
      fullName: initialUser.fullName,
      email: initialUser.email,
      passwordHash,
      roleId: roleRecord.id,
      managerId: null,
    });
  }
};

export { seedInitialUsers };
