import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { User, Role, Task, TaskAssignment } from '../models/index.js';

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

const SAMPLE_EMPLOYEES = [
  { fullName: 'Mydeen Employee', email: 'mydeen@gamil.com' },
  { fullName: 'Aarav Kumar', email: 'aarav.employee@gmail.com' },
  { fullName: 'Priya Sharma', email: 'priya.employee@gmail.com' },
  { fullName: 'Rahul Verma', email: 'rahul.employee@gmail.com' },
  { fullName: 'Sneha Iyer', email: 'sneha.employee@gmail.com' },
];

const SAMPLE_TASKS = [
  {
    title: 'Prepare quarterly hiring forecast',
    description: 'Collect manpower plans from all departments and prepare the next quarter forecast.',
    priority: 'High',
    weight: 8,
    deadlineOffsetDays: 5,
  },
  {
    title: 'Update onboarding checklist',
    description: 'Revise the onboarding checklist for new employees and publish the latest template.',
    priority: 'Medium',
    weight: 3,
    deadlineOffsetDays: 8,
  },
  {
    title: 'Audit pending reimbursement requests',
    description: 'Review open reimbursement claims and mark documents that need corrections.',
    priority: 'Low',
    weight: 2,
    deadlineOffsetDays: 3,
  },
  {
    title: 'Compile support escalation report',
    description: 'Summarize unresolved escalations and share the report with leadership.',
    priority: 'High',
    weight: 6,
    deadlineOffsetDays: 2,
  },
  {
    title: 'Verify timesheet compliance',
    description: 'Check this week timesheet submission status for the operations team.',
    priority: 'Medium',
    weight: 4,
    deadlineOffsetDays: 4,
  },
];

const addDays = (days) => {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const seedInitialUsers = async () => {
  const roleRecords = {
    admin: await Role.findOne({ where: { name: 'admin' } }),
    manager: await Role.findOne({ where: { name: 'manager' } }),
    employee: await Role.findOne({ where: { name: 'employee' } }),
  };

  for (const [roleName, roleRecord] of Object.entries(roleRecords)) {
    if (!roleRecord) {
      throw new Error(`Role "${roleName}" must exist before seeding users`);
    }
  }

  for (const initialUser of INITIAL_USERS) {
    const roleRecord = roleRecords[initialUser.role];
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

  await TaskAssignment.destroy({ where: {} });
  await Task.destroy({ where: {} });

  const manager = await User.findOne({ where: { email: 'haan@gmail.com' } });
  if (!manager) {
    throw new Error('Manager account "haan@gmail.com" must exist before seeding employees');
  }

  for (const employeeSeed of SAMPLE_EMPLOYEES) {
    const existingUser = await User.findOne({ where: { email: employeeSeed.email } });
    if (existingUser) {
      await existingUser.update({
        fullName: employeeSeed.fullName,
        roleId: roleRecords.employee.id,
        managerId: manager.id,
      });
      continue;
    }

    const passwordHash = bcrypt.hashSync('123456', 10);
    await User.create({
      fullName: employeeSeed.fullName,
      email: employeeSeed.email,
      passwordHash,
      roleId: roleRecords.employee.id,
      managerId: manager.id,
    });
  }

  for (const taskSeed of SAMPLE_TASKS) {
    await Task.findOrCreate({
      where: {
        title: taskSeed.title,
        assignedBy: manager.id,
      },
      defaults: {
        title: taskSeed.title,
        description: taskSeed.description,
        priority: taskSeed.priority,
        weight: taskSeed.weight,
        deadline: addDays(taskSeed.deadlineOffsetDays),
        assignedBy: manager.id,
      },
    });
  }

  const keepEmails = [...new Set([...INITIAL_USERS.map((user) => user.email), ...SAMPLE_EMPLOYEES.map((user) => user.email)])];
  await User.destroy({
    where: {
      email: {
        [Op.notIn]: keepEmails,
      },
    },
  });
};

export { seedInitialUsers };
