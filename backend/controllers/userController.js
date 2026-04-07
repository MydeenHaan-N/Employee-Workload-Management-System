import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { User, Role, Task, TaskAssignment } from '../models/index.js';

const ACTIVE_TASK_STATUSES = ['Pending', 'In Progress', 'Overdue'];

const getRoleByName = (name) => Role.findOne({
  where: { name: name?.toLowerCase().trim() },
});

const isRole = (req, roleName) => req.user.roleName === roleName;

const createUser = async (req, res) => {
  const { fullName, email, password, role } = req.body;
  const creatorRole = req.user.roleName;

  try {
    if (creatorRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create users' });
    }

    const roleRecord = await getRoleByName(role);
    if (!roleRecord) {
      return res.status(400).json({ message: 'Selected role does not exist' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      roleId: roleRecord.id,
      managerId: null,
    });

    res.status(201).json(user);
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map((error) => error.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email already exists' });
    }

    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullName, role } = req.body;
  const requesterRole = req.user.roleName;

  try {
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'roleDetails', attributes: ['name'] }],
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (requesterRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update users' });
    }

    let nextRole = user.roleDetails?.name;
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
  const requesterRole = req.user.roleName;
  const requesterId = req.user.id;

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
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, as: 'roleDetails', attributes: ['id', 'name', 'description'] }],
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllUsers = async (req, res) => {
  if (!isRole(req, 'admin')) return res.status(403).json({ message: 'Access denied' });
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
  if (!isRole(req, 'manager')) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const employeeRole = await getRoleByName('employee');
    const employees = await User.findAll({
      where: {
        managerId: req.user.id,
        roleId: employeeRole?.id,
      },
      include: [{ model: Role, as: 'roleDetails', attributes: ['id', 'name'] }],
      order: [['fullName', 'ASC']],
    });

    const employeeIds = employees.map((employee) => employee.id);
    const assignments = employeeIds.length > 0
      ? await TaskAssignment.findAll({
          where: {
            employeeId: { [Op.in]: employeeIds },
          },
          attributes: ['employeeId', 'status', 'completionPercent', 'isActive'],
          include: [{ model: Task, as: 'task', attributes: ['weight'] }],
        })
      : [];

    const workloadByEmployee = employeeIds.reduce((acc, id) => {
      acc[id] = {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        active: 0,
        totalWeight: 0,
        activeWeight: 0,
        remainingWeight: 0,
      };
      return acc;
    }, {});

    for (const assignment of assignments) {
      const stats = workloadByEmployee[assignment.employeeId];
      if (!stats) continue;

      const weight = assignment.task?.weight ?? 1;
      const remainingWeight = weight * (1 - ((assignment.completionPercent || 0) / 100));

      stats.total += 1;
      stats.totalWeight += weight;
      if (assignment.status === 'Pending') stats.pending += 1;
      if (assignment.status === 'In Progress') stats.inProgress += 1;
      if (assignment.status === 'Completed') stats.completed += 1;
      if (assignment.status === 'Overdue') stats.overdue += 1;
      if (assignment.isActive && ACTIVE_TASK_STATUSES.includes(assignment.status)) {
        stats.active += 1;
        stats.activeWeight += weight;
        stats.remainingWeight += remainingWeight;
      }
    }

    const team = employees.map((employee) => ({
      ...employee.toJSON(),
      workload: workloadByEmployee[employee.id] || {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        active: 0,
        totalWeight: 0,
        activeWeight: 0,
        remainingWeight: 0,
      },
    }));

    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAvailableEmployees = async (req, res) => {
  if (!isRole(req, 'manager')) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const employeeRole = await getRoleByName('employee');
    const employees = await User.findAll({
      where: {
        roleId: employeeRole?.id,
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
  if (!isRole(req, 'manager')) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const employee = await User.findByPk(req.params.id, {
      include: [{ model: Role, as: 'roleDetails', attributes: ['name'] }],
    });
    if (!employee || employee.roleDetails?.name !== 'employee') {
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
  if (!isRole(req, 'manager')) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const employee = await User.findByPk(req.params.id, {
      include: [{ model: Role, as: 'roleDetails', attributes: ['name'] }],
    });
    if (!employee || employee.roleDetails?.name !== 'employee') {
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

export {
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
