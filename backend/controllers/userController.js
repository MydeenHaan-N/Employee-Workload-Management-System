const bcrypt = require('bcrypt');
const { User, Role, Task } = require('../models/index');
const { Op } = require('sequelize');

const ACTIVE_TASK_STATUSES = ['Pending', 'In Progress'];

const getRoleByName = (name) => Role.findOne({
  where: { name: name?.toLowerCase().trim() },
});

const createUser = async (req, res) => {
  const { fullName, email, password, role } = req.body;
  const { role: creatorRole } = req.user;

  try {
    if (creatorRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create users' });
    }

    const roleRecord = await getRoleByName(role);
    if (!roleRecord) {
      return res.status(400).json({ message: 'Selected role does not exist' });
    }

    const normalizedRole = roleRecord.name;
    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      role: normalizedRole,
      roleId: roleRecord.id,
      managerId: null,
    });

    res.status(201).json(user);
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    } else if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email already exists' });
    } else {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullName, role } = req.body; // password update separate if needed
  const { role: requesterRole } = req.user;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (requesterRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update users' });
    }

    let nextRole = user.role;
    let nextRoleId = user.roleId;
    let nextManagerId = user.managerId;

    if (role) {
      const roleRecord = await getRoleByName(role);
      if (!roleRecord) {
        return res.status(400).json({ message: 'Selected role does not exist' });
      }

      nextRole = roleRecord.name;
      nextRoleId = roleRecord.id;
    }

    if (nextRole !== 'employee') {
      nextManagerId = null;
    }

    await user.update({
      fullName: fullName ?? user.fullName,
      role: nextRole,
      roleId: nextRoleId,
      managerId: nextManagerId,
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  const { role: requesterRole, id: requesterId } = req.user;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (requesterRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete users' });
    }

    if (user.id === requesterId) {
      return res.status(403).json({ message: 'Cannot delete yourself' });
    }

    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllUsers = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  try {
    const users = await User.findAll({
      include: [{ model: Role, as: 'roleDetails', attributes: ['id', 'name', 'description'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyTeam = async (req, res) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const employees = await User.findAll({
      where: {
        managerId: req.user.id,
        role: 'employee',
      },
      include: [{ model: Role, as: 'roleDetails', attributes: ['id', 'name'] }],
      order: [['fullName', 'ASC']],
    });

    const employeeIds = employees.map((employee) => employee.id);
    const tasks = employeeIds.length > 0
      ? await Task.findAll({
          where: {
            assignedTo: { [Op.in]: employeeIds },
          },
          attributes: ['assignedTo', 'status'],
        })
      : [];

    const workloadByEmployee = employeeIds.reduce((acc, id) => {
      acc[id] = { total: 0, pending: 0, inProgress: 0, completed: 0, active: 0 };
      return acc;
    }, {});

    for (const task of tasks) {
      const stats = workloadByEmployee[task.assignedTo];
      if (!stats) continue;

      stats.total += 1;
      if (task.status === 'Pending') stats.pending += 1;
      if (task.status === 'In Progress') stats.inProgress += 1;
      if (task.status === 'Completed') stats.completed += 1;
      if (ACTIVE_TASK_STATUSES.includes(task.status)) stats.active += 1;
    }

    const team = employees.map((employee) => ({
      ...employee.toJSON(),
      workload: workloadByEmployee[employee.id] || { total: 0, pending: 0, inProgress: 0, completed: 0, active: 0 },
    }));

    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAvailableEmployees = async (req, res) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const employees = await User.findAll({
      where: {
        role: 'employee',
        managerId: null,
      },
      include: [{ model: Role, as: 'roleDetails', attributes: ['id', 'name'] }],
      order: [['fullName', 'ASC']],
    });

    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const claimEmployee = async (req, res) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const employee = await User.findByPk(req.params.id);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (employee.managerId && employee.managerId !== req.user.id) {
      return res.status(409).json({ message: 'Employee is already assigned to another manager' });
    }

    if (employee.managerId === req.user.id) {
      return res.json(employee);
    }

    await employee.update({ managerId: req.user.id });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const releaseEmployee = async (req, res) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const employee = await User.findByPk(req.params.id);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (employee.managerId !== req.user.id) {
      return res.status(403).json({ message: 'You can only release employees assigned to you' });
    }

    await employee.update({ managerId: null });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  getMe,
  getAllUsers,
  getMyTeam,
  getAvailableEmployees,
  claimEmployee,
  releaseEmployee,
};
