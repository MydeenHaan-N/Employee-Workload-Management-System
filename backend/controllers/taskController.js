import { Op } from 'sequelize';
import { Task, TaskAssignment, User, sequelize } from '../models/index.js';

const ACTIVE_ASSIGNMENT_STATUSES = ['Pending', 'In Progress', 'Overdue'];
const EMPLOYEE_ROLE = 'employee';
const MANAGER_ROLE = 'manager';

const clampCompletionPercent = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
};

const syncOverdueStatus = async (assignment) => {
  const taskDeadline = assignment.task?.deadline || assignment.deadline;
  if (!taskDeadline) return assignment;

  const isPastDeadline = new Date(taskDeadline) < new Date();
  if (isPastDeadline && !['Completed', 'Overdue'].includes(assignment.status)) {
    assignment.status = 'Overdue';
    await assignment.save();
  }

  return assignment;
};

const getTeamEmployees = async (managerId, transaction) => User.findAll({
  where: {
    managerId,
    '$roleDetails.name$': EMPLOYEE_ROLE,
  },
  include: [{ association: 'roleDetails', attributes: [] }],
  order: [['id', 'ASC']],
  transaction,
});

const findBestEmployeeForTask = async (managerId, transaction) => {
  const employees = await getTeamEmployees(managerId, transaction);
  if (employees.length === 0) {
    return null;
  }

  const activeAssignments = await TaskAssignment.findAll({
    where: {
      employeeId: { [Op.in]: employees.map((employee) => employee.id) },
      isActive: true,
      status: { [Op.in]: ACTIVE_ASSIGNMENT_STATUSES },
    },
    include: [{ model: Task, as: 'task', attributes: ['weight'] }],
    transaction,
  });

  const loadByEmployee = employees.reduce((acc, employee) => {
    acc[employee.id] = {
      employee,
      weightedLoad: 0,
      activeAssignments: 0,
    };
    return acc;
  }, {});

  for (const assignment of activeAssignments) {
    const bucket = loadByEmployee[assignment.employeeId];
    if (!bucket) continue;

    const weight = assignment.task?.weight ?? 1;
    const remainingWorkFactor = 1 - (assignment.completionPercent / 100);
    bucket.weightedLoad += weight * remainingWorkFactor;
    bucket.activeAssignments += 1;
  }

  return Object.values(loadByEmployee)
    .sort((left, right) => {
      if (left.weightedLoad !== right.weightedLoad) {
        return left.weightedLoad - right.weightedLoad;
      }
      if (left.activeAssignments !== right.activeAssignments) {
        return left.activeAssignments - right.activeAssignments;
      }
      return left.employee.id - right.employee.id;
    })[0]?.employee || null;
};

const buildTaskResponse = (task, assignment) => ({
  ...task.toJSON(),
  assignedTo: assignment.employeeId,
  status: assignment.status,
  completionPercent: assignment.completionPercent,
  assignedAt: assignment.assignedAt,
  startedAt: assignment.startedAt,
  completedAt: assignment.completedAt,
  assignmentId: assignment.id,
});

const createTask = async (req, res) => {
  const { title, description, priority, deadline, assignedTo, weight } = req.body;
  const assignedBy = req.user.id;

  if (req.user.roleName !== MANAGER_ROLE) return res.status(403).json({ message: 'Access denied' });

  if (!title || !priority || !deadline) {
    return res.status(400).json({ message: 'Title, priority, and deadline are required' });
  }

  const normalizedWeight = Number.parseInt(weight, 10);
  if (Number.isNaN(normalizedWeight) || normalizedWeight < 1 || normalizedWeight > 10) {
    return res.status(400).json({ message: 'Weight must be a number between 1 and 10' });
  }

  try {
    const result = await sequelize.transaction(async (transaction) => {
      let employee = null;
      let assignmentMode = 'auto';

      if (assignedTo) {
        employee = await User.findByPk(assignedTo, {
          transaction,
          include: [{ association: 'roleDetails', attributes: ['name'] }],
        });
        if (!employee || employee.managerId !== assignedBy) {
          throw new Error('Invalid employee or not under you');
        }
        const employeeRole = employee.roleDetails;
        if (employeeRole?.name !== EMPLOYEE_ROLE) {
          throw new Error('Invalid employee or not under you');
        }
        assignmentMode = 'manual';
      } else {
        employee = await findBestEmployeeForTask(assignedBy, transaction);
        if (!employee) {
          throw new Error('No employees available under this manager for auto-assignment');
        }
      }

      const task = await Task.create({
        title,
        description,
        priority,
        deadline,
        weight: normalizedWeight,
        assignedBy,
      }, { transaction });

      const assignment = await TaskAssignment.create({
        taskId: task.id,
        employeeId: employee.id,
        assignedBy,
        status: 'Pending',
        completionPercent: 0,
      }, { transaction });

      return { task, assignment, assignmentMode, employee };
    });

    res.status(201).json({
      ...buildTaskResponse(result.task, result.assignment),
      assignmentMode: result.assignmentMode,
      assignee: {
        id: result.employee.id,
        fullName: result.employee.fullName,
      },
    });
  } catch (err) {
    const statusCode = err.message.includes('Invalid employee') || err.message.includes('No employees')
      ? 400
      : 500;
    res.status(statusCode).json({ message: err.message });
  }
};

const getMyTasks = async (req, res) => {
  if (req.user.roleName !== EMPLOYEE_ROLE) return res.status(403).json({ message: 'Access denied' });

  try {
    const assignments = await TaskAssignment.findAll({
      where: {
        employeeId: req.user.id,
        isActive: true,
      },
      include: [{ model: Task, as: 'task' }],
      order: [[{ model: Task, as: 'task' }, 'deadline', 'ASC']],
    });

    const tasks = [];
    for (const assignment of assignments) {
      await syncOverdueStatus(assignment);
      tasks.push(buildTaskResponse(assignment.task, assignment));
    }

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status, completionPercent } = req.body;

  if (req.user.roleName !== EMPLOYEE_ROLE) return res.status(403).json({ message: 'Access denied' });

  try {
    const assignment = await TaskAssignment.findOne({
      where: {
        taskId: id,
        employeeId: req.user.id,
        isActive: true,
      },
      include: [{ model: Task, as: 'task' }],
    });

    if (!assignment) return res.status(404).json({ message: 'Task not found' });

    await syncOverdueStatus(assignment);

    if (status) {
      assignment.status = status;
    }

    if (completionPercent !== undefined) {
      assignment.completionPercent = clampCompletionPercent(completionPercent);
    }

    if (assignment.status === 'In Progress' && !assignment.startedAt) {
      assignment.startedAt = new Date();
    }

    if (assignment.status === 'Completed') {
      assignment.completionPercent = 100;
      assignment.completedAt = new Date();
      assignment.isActive = false;
    } else {
      assignment.completedAt = null;
      if (assignment.completionPercent === 100) {
        assignment.status = 'Completed';
        assignment.completedAt = new Date();
        assignment.isActive = false;
      }
    }

    await assignment.save();
    res.json(buildTaskResponse(assignment.task, assignment));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { createTask, getMyTasks, updateTaskStatus };
