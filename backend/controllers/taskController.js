import { Op } from 'sequelize';
import { Task, TaskAssignment, User, sequelize } from '../models/index.js';

const ACTIVE_ASSIGNMENT_STATUSES = ['Pending', 'In Progress', 'Overdue'];
const EMPLOYEE_ROLE = 'employee';
const MANAGER_ROLE = 'manager';
const PRIORITY_SCORE = { High: 3, Medium: 2, Low: 1 };

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

const buildEmployeeLoadMap = async (managerId, transaction) => {
  const employees = await getTeamEmployees(managerId, transaction);
  if (employees.length === 0) {
    return { employees: [], loadByEmployee: {} };
  }

  const activeAssignments = await TaskAssignment.findAll({
    where: {
      employeeId: { [Op.in]: employees.map((employee) => employee.id) },
      isActive: true,
      status: { [Op.in]: ACTIVE_ASSIGNMENT_STATUSES },
    },
    include: [{ model: Task, as: 'task', attributes: ['weight', 'priority', 'deadline'] }],
    transaction,
  });

  const loadByEmployee = employees.reduce((acc, employee) => {
    acc[employee.id] = {
      employee,
      weightedLoad: 0,
      activeAssignments: 0,
      overdueCount: 0,
      urgentCount: 0,
    };
    return acc;
  }, {});

  for (const assignment of activeAssignments) {
    const bucket = loadByEmployee[assignment.employeeId];
    if (!bucket) continue;

    const task = assignment.task;
    const weight = task?.weight ?? 1;
    const remainingWorkFactor = 1 - (assignment.completionPercent / 100);
    bucket.weightedLoad += weight * remainingWorkFactor;
    bucket.activeAssignments += 1;

    if (assignment.status === 'Overdue') bucket.overdueCount += 1;
    if (task?.deadline && new Date(task.deadline) <= addDaysFromNow(2)) {
      bucket.urgentCount += 1;
    }
  }

  return { employees, loadByEmployee };
};

const chooseBestEmployeeFromLoadMap = (loadByEmployee) => (
  Object.values(loadByEmployee)
    .sort((left, right) => {
      if (left.weightedLoad !== right.weightedLoad) return left.weightedLoad - right.weightedLoad;
      if (left.overdueCount !== right.overdueCount) return left.overdueCount - right.overdueCount;
      if (left.urgentCount !== right.urgentCount) return left.urgentCount - right.urgentCount;
      if (left.activeAssignments !== right.activeAssignments) return left.activeAssignments - right.activeAssignments;
      return left.employee.id - right.employee.id;
    })[0]?.employee || null
);

const addDaysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const getTaskUrgencyScore = (task) => {
  const priorityScore = PRIORITY_SCORE[task.priority] ?? 1;
  const weightScore = task.weight ?? 1;
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const now = new Date();

  let urgencyScore = 0;
  if (deadlineDate) {
    const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntilDeadline < 0) urgencyScore = 100;
    else if (daysUntilDeadline === 0) urgencyScore = 80;
    else if (daysUntilDeadline <= 2) urgencyScore = 60;
    else if (daysUntilDeadline <= 5) urgencyScore = 40;
    else urgencyScore = 20;
  }

  return urgencyScore + (priorityScore * 10) + weightScore;
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

const buildUnassignedTaskResponse = (task) => ({
  ...task.toJSON(),
  assignedTo: null,
  status: 'Unassigned',
  completionPercent: 0,
  assignedAt: null,
  startedAt: null,
  completedAt: null,
  assignmentId: null,
});

const createTask = async (req, res) => {
  const { title, description, priority, deadline, assignedTo, weight, autoAssign } = req.body;
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
      let assignmentMode = 'unassigned';

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
      } else if (autoAssign) {
        employee = await findBestEmployeeForTask(assignedBy, transaction);
        if (!employee) {
          throw new Error('No employees available under this manager for auto-assignment');
        }
        assignmentMode = 'auto';
      }

      const task = await Task.create({
        title,
        description,
        priority,
        deadline,
        weight: normalizedWeight,
        assignedBy,
      }, { transaction });

      let assignment = null;
      if (employee) {
        assignment = await TaskAssignment.create({
          taskId: task.id,
          employeeId: employee.id,
          assignedBy,
          status: 'Pending',
          completionPercent: 0,
        }, { transaction });
      }

      return { task, assignment, assignmentMode, employee };
    });

    if (!result.assignment) {
      return res.status(201).json({
        ...buildUnassignedTaskResponse(result.task),
        assignmentMode: result.assignmentMode,
      });
    }

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

const getManagerTaskBoard = async (req, res) => {
  if (req.user.roleName !== MANAGER_ROLE) return res.status(403).json({ message: 'Access denied' });

  try {
    const employees = await User.findAll({
      where: {
        managerId: req.user.id,
        '$roleDetails.name$': EMPLOYEE_ROLE,
      },
      include: [{ association: 'roleDetails', attributes: ['id', 'name'] }],
      order: [['fullName', 'ASC']],
    });

    const employeeIds = employees.map((employee) => employee.id);

    const assignments = employeeIds.length > 0
      ? await TaskAssignment.findAll({
          where: {
            employeeId: { [Op.in]: employeeIds },
            isActive: true,
          },
          include: [{ model: Task, as: 'task' }],
          order: [[{ model: Task, as: 'task' }, 'deadline', 'ASC']],
        })
      : [];

    const assignedTasksByEmployee = employeeIds.reduce((acc, employeeId) => {
      acc[employeeId] = [];
      return acc;
    }, {});

    const workloadByEmployee = employeeIds.reduce((acc, employeeId) => {
      acc[employeeId] = {
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
      await syncOverdueStatus(assignment);
      const taskResponse = buildTaskResponse(assignment.task, assignment);
      const weight = assignment.task?.weight ?? 1;
      const remainingWeight = weight * (1 - ((assignment.completionPercent || 0) / 100));

      if (!assignedTasksByEmployee[assignment.employeeId]) {
        assignedTasksByEmployee[assignment.employeeId] = [];
      }
      assignedTasksByEmployee[assignment.employeeId].push(taskResponse);

      if (workloadByEmployee[assignment.employeeId]) {
        workloadByEmployee[assignment.employeeId].total += 1;
        workloadByEmployee[assignment.employeeId].totalWeight += weight;
        if (assignment.status === 'Pending') workloadByEmployee[assignment.employeeId].pending += 1;
        if (assignment.status === 'In Progress') workloadByEmployee[assignment.employeeId].inProgress += 1;
        if (assignment.status === 'Completed') workloadByEmployee[assignment.employeeId].completed += 1;
        if (assignment.status === 'Overdue') workloadByEmployee[assignment.employeeId].overdue += 1;
        if (assignment.isActive && ACTIVE_ASSIGNMENT_STATUSES.includes(assignment.status)) {
          workloadByEmployee[assignment.employeeId].active += 1;
          workloadByEmployee[assignment.employeeId].activeWeight += weight;
          workloadByEmployee[assignment.employeeId].remainingWeight += remainingWeight;
        }
      }
    }

    const managerTasks = await Task.findAll({
      where: { assignedBy: req.user.id },
      include: [{ model: TaskAssignment, as: 'assignments', required: false }],
      order: [['createdAt', 'DESC']],
    });

    const unassignedTasks = managerTasks
      .filter((task) => !task.assignments || task.assignments.length === 0)
      .map((task) => buildUnassignedTaskResponse(task));

    const team = employees.map((employee) => ({
      ...employee.toJSON(),
      assignedTasks: assignedTasksByEmployee[employee.id] || [],
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

    res.json({
      team,
      unassignedTasks,
      summary: {
        teamCount: team.length,
        assignedTaskCount: assignments.length,
        unassignedTaskCount: unassignedTasks.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const assignTaskToEmployee = async (req, res) => {
  const { id } = req.params;
  const { employeeId } = req.body;

  if (req.user.roleName !== MANAGER_ROLE) return res.status(403).json({ message: 'Access denied' });

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const task = await Task.findOne({
        where: { id, assignedBy: req.user.id },
        include: [{ model: TaskAssignment, as: 'assignments', required: false }],
        transaction,
      });

      if (!task) {
        throw new Error('Task not found');
      }

      let employee = null;
      if (employeeId) {
        employee = await User.findByPk(employeeId, {
          transaction,
          include: [{ association: 'roleDetails', attributes: ['name'] }],
        });

        if (!employee || employee.managerId !== req.user.id || employee.roleDetails?.name !== EMPLOYEE_ROLE) {
          throw new Error('Invalid employee or not under you');
        }
      } else {
        employee = await findBestEmployeeForTask(req.user.id, transaction);
        if (!employee) {
          throw new Error('No employees available for auto-assignment');
        }
      }

      const existingAssignment = await TaskAssignment.findOne({
        where: { taskId: task.id },
        transaction,
      });

      let assignment = existingAssignment;
      if (!assignment) {
        assignment = await TaskAssignment.create({
          taskId: task.id,
          employeeId: employee.id,
          assignedBy: req.user.id,
          status: 'Pending',
          completionPercent: 0,
          isActive: true,
        }, { transaction });
      } else {
        await assignment.update({
          employeeId: employee.id,
          assignedBy: req.user.id,
          status: 'Pending',
          completionPercent: 0,
          startedAt: null,
          completedAt: null,
          isActive: true,
        }, { transaction });
      }

      return { task, assignment, employee };
    });

    res.json({
      ...buildTaskResponse(result.task, result.assignment),
      assignee: {
        id: result.employee.id,
        fullName: result.employee.fullName,
      },
    });
  } catch (err) {
    const statusCode = ['Task not found', 'Invalid employee or not under you', 'No employees available for auto-assignment']
      .includes(err.message)
      ? 400
      : 500;
    res.status(statusCode).json({ message: err.message });
  }
};

const autoAssignBacklogTasks = async (req, res) => {
  if (req.user.roleName !== MANAGER_ROLE) return res.status(403).json({ message: 'Access denied' });

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const { employees, loadByEmployee } = await buildEmployeeLoadMap(req.user.id, transaction);
      if (employees.length === 0) {
        throw new Error('No employees available for auto-assignment');
      }

      const managerTasks = await Task.findAll({
        where: { assignedBy: req.user.id },
        include: [{ model: TaskAssignment, as: 'assignments', required: false }],
        transaction,
      });

      const backlogTasks = managerTasks
        .filter((task) => !task.assignments || task.assignments.length === 0)
        .sort((left, right) => {
          const scoreDifference = getTaskUrgencyScore(right) - getTaskUrgencyScore(left);
          if (scoreDifference !== 0) return scoreDifference;
          return new Date(left.createdAt) - new Date(right.createdAt);
        });

      const createdAssignments = [];
      for (const task of backlogTasks) {
        const employee = chooseBestEmployeeFromLoadMap(loadByEmployee);
        if (!employee) break;

        const assignment = await TaskAssignment.create({
          taskId: task.id,
          employeeId: employee.id,
          assignedBy: req.user.id,
          status: 'Pending',
          completionPercent: 0,
          isActive: true,
        }, { transaction });

        const bucket = loadByEmployee[employee.id];
        const weight = task.weight ?? 1;
        bucket.weightedLoad += weight;
        bucket.activeAssignments += 1;
        if (task.deadline && new Date(task.deadline) <= addDaysFromNow(2)) {
          bucket.urgentCount += 1;
        }

        createdAssignments.push({
          taskId: task.id,
          title: task.title,
          employeeId: employee.id,
          employeeName: employee.fullName,
          assignmentId: assignment.id,
        });
      }

      return createdAssignments;
    });

    res.json({
      message: result.length > 0
        ? `Auto-assigned ${result.length} backlog task${result.length === 1 ? '' : 's'} successfully`
        : 'No backlog tasks available for auto-assignment',
      assignments: result,
    });
  } catch (err) {
    const statusCode = err.message === 'No employees available for auto-assignment' ? 400 : 500;
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

export { createTask, getManagerTaskBoard, assignTaskToEmployee, autoAssignBacklogTasks, getMyTasks, updateTaskStatus };
