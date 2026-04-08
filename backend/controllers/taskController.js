import { Op } from 'sequelize';
import { Task, TaskAssignment, User, sequelize } from '../models/index.js';
import {
  ACTIVE_STATUSES,
  buildEmployeeInsight,
  buildEscalationAlerts,
  buildManagerAnalytics,
  parseSkills,
  rankEmployeesForTask,
  serializeSkills,
} from '../services/workforceInsightsService.js';

const EMPLOYEE_ROLE = 'employee';
const MANAGER_ROLE = 'manager';

const clampCompletionPercent = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
};

const normalizeTaskInput = (payload = {}) => ({
  title: payload.title?.trim(),
  description: payload.description?.trim() || '',
  priority: payload.priority || 'Medium',
  deadline: payload.deadline,
  weight: Number.parseInt(payload.weight, 10),
  requiredSkills: parseSkills(payload.requiredSkills),
});

const validateTaskInput = (taskInput) => {
  if (!taskInput.title || !taskInput.priority || !taskInput.deadline) {
    return 'Title, priority, and deadline are required';
  }

  if (Number.isNaN(taskInput.weight) || taskInput.weight < 1 || taskInput.weight > 10) {
    return 'Weight must be a number between 1 and 10';
  }

  return null;
};

const syncOverdueStatus = async (assignment) => {
  const taskDeadline = assignment.task?.deadline;
  if (!taskDeadline) return assignment;

  const isPastDeadline = new Date(taskDeadline) < new Date();
  if (isPastDeadline && !['Completed', 'Overdue'].includes(assignment.status)) {
    assignment.status = 'Overdue';
    await assignment.save();
  }

  return assignment;
};

const buildTaskResponse = (task, assignment = null, extra = {}) => ({
  ...task.toJSON(),
  requiredSkills: parseSkills(task.requiredSkills),
  assignedTo: assignment?.employeeId ?? null,
  status: assignment?.status || 'Unassigned',
  completionPercent: assignment?.completionPercent ?? 0,
  assignedAt: assignment?.assignedAt ?? null,
  startedAt: assignment?.startedAt ?? null,
  completedAt: assignment?.completedAt ?? null,
  assignmentId: assignment?.id ?? null,
  ...extra,
});

const getManagerEmployees = async (managerId, transaction) => User.findAll({
  where: {
    managerId,
    '$roleDetails.name$': EMPLOYEE_ROLE,
  },
  include: [{ association: 'roleDetails', attributes: ['id', 'name'] }],
  order: [['fullName', 'ASC']],
  transaction,
});

const getManagerAssignments = async (employeeIds, transaction) => {
  if (employeeIds.length === 0) return [];

  return TaskAssignment.findAll({
    where: {
      employeeId: { [Op.in]: employeeIds },
    },
    include: [
      { model: Task, as: 'task' },
      { model: User, as: 'employee', attributes: ['id', 'fullName', 'email'] },
    ],
    order: [[{ model: Task, as: 'task' }, 'deadline', 'ASC']],
    transaction,
  });
};

const getTaskRecommendations = (task, employees, assignmentsByEmployee) => rankEmployeesForTask({
  employees: employees.map((employee) => employee.toJSON()),
  assignmentsByEmployee,
  taskInput: {
    weight: task.weight,
    priority: task.priority,
    deadline: task.deadline,
    requiredSkills: task.requiredSkills,
  },
});

const enrichManagerBoardData = async (managerId, transaction = null) => {
  const employees = await getManagerEmployees(managerId, transaction);
  const employeeIds = employees.map((employee) => employee.id);
  const assignments = await getManagerAssignments(employeeIds, transaction);

  for (const assignment of assignments) {
    await syncOverdueStatus(assignment);
  }

  const assignmentsByEmployee = employeeIds.reduce((acc, employeeId) => {
    acc[employeeId] = [];
    return acc;
  }, {});

  for (const assignment of assignments) {
    if (!assignmentsByEmployee[assignment.employeeId]) assignmentsByEmployee[assignment.employeeId] = [];
    assignmentsByEmployee[assignment.employeeId].push(assignment);
  }

  const managerTasks = await Task.findAll({
    where: { assignedBy: managerId },
    include: [{ model: TaskAssignment, as: 'assignments', required: false }],
    order: [['createdAt', 'DESC']],
    transaction,
  });

  const team = employees.map((employee) => {
    const employeeAssignments = assignmentsByEmployee[employee.id] || [];
    const insight = buildEmployeeInsight({
      id: employee.id,
      skills: employee.skills,
    }, employeeAssignments);
    const activeAssignedTasks = employeeAssignments
      .filter((assignment) => assignment.isActive || assignment.status === 'Completed')
      .map((assignment) => buildTaskResponse(assignment.task, assignment));

    const workload = {
      total: employeeAssignments.length,
      active: insight.activeAssignments,
      pending: employeeAssignments.filter((assignment) => assignment.status === 'Pending').length,
      inProgress: employeeAssignments.filter((assignment) => assignment.status === 'In Progress').length,
      completed: employeeAssignments.filter((assignment) => assignment.status === 'Completed').length,
      overdue: employeeAssignments.filter((assignment) => assignment.status === 'Overdue').length,
      remainingWeight: insight.workloadScore,
      urgent: insight.urgentCount,
      stalled: insight.stalledCount,
    };

    return {
      ...employee.toJSON(),
      skills: parseSkills(employee.skills),
      assignedTasks: activeAssignedTasks,
      workload,
      burnoutRisk: insight.burnoutRisk,
      performance: insight.performance,
    };
  });

  const unassignedTasks = managerTasks
    .filter((task) => !task.assignments || task.assignments.length === 0)
    .map((task) => ({
      ...buildTaskResponse(task),
      recommendations: getTaskRecommendations(task, employees, assignmentsByEmployee).slice(0, 3),
    }));

  const activeAssignments = assignments.filter((assignment) => assignment.isActive);
  const analytics = buildManagerAnalytics({
    teamInsights: team.map((member) => ({
      employeeId: member.id,
      skills: member.skills,
      workloadScore: member.workload.remainingWeight,
      activeAssignments: member.workload.active,
      overdueCount: member.workload.overdue,
      urgentCount: member.workload.urgent,
      stalledCount: member.workload.stalled,
      burnoutRisk: member.burnoutRisk,
      performance: member.performance,
    })),
    assignments,
    tasks: managerTasks,
  });

  return {
    team,
    unassignedTasks,
    alerts: buildEscalationAlerts(activeAssignments),
    analytics,
    summary: {
      teamCount: team.length,
      assignedTaskCount: activeAssignments.length,
      unassignedTaskCount: unassignedTasks.length,
      criticalRiskEmployees: team.filter((member) => member.burnoutRisk.level === 'Critical').length,
    },
    assignmentsByEmployee,
    employees,
  };
};

const createTask = async (req, res) => {
  const { assignedTo, autoAssign } = req.body;
  const assignedBy = req.user.id;

  if (req.user.roleName !== MANAGER_ROLE) return res.status(403).json({ message: 'Access denied' });

  const taskInput = normalizeTaskInput(req.body);
  const validationError = validateTaskInput(taskInput);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const boardData = await enrichManagerBoardData(assignedBy, transaction);

      let employee = null;
      let assignmentMode = 'unassigned';

      if (assignedTo) {
        employee = await User.findByPk(assignedTo, {
          transaction,
          include: [{ association: 'roleDetails', attributes: ['name'] }],
        });
        if (!employee || employee.managerId !== assignedBy || employee.roleDetails?.name !== EMPLOYEE_ROLE) {
          throw new Error('Invalid employee or not under you');
        }
        assignmentMode = 'manual';
      } else if (autoAssign) {
        [employee] = getTaskRecommendations({
          ...taskInput,
          requiredSkills: serializeSkills(taskInput.requiredSkills),
        }, boardData.employees, boardData.assignmentsByEmployee);
        if (!employee) {
          throw new Error('No employees available under this manager for auto-assignment');
        }
        employee = boardData.employees.find((item) => item.id === employee.employeeId) || null;
        assignmentMode = 'smart';
      }

      const task = await Task.create({
        title: taskInput.title,
        description: taskInput.description,
        priority: taskInput.priority,
        deadline: taskInput.deadline,
        weight: taskInput.weight,
        requiredSkills: serializeSkills(taskInput.requiredSkills),
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

      const recommendations = getTaskRecommendations(task, boardData.employees, boardData.assignmentsByEmployee);
      return { task, assignment, employee, assignmentMode, recommendations };
    });

    res.status(201).json(buildTaskResponse(result.task, result.assignment, {
      assignmentMode: result.assignmentMode,
      assignee: result.employee
        ? { id: result.employee.id, fullName: result.employee.fullName }
        : null,
      recommendations: result.recommendations.slice(0, 3),
    }));
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
    const boardData = await enrichManagerBoardData(req.user.id);
    res.json({
      team: boardData.team,
      unassignedTasks: boardData.unassignedTasks,
      alerts: boardData.alerts,
      analytics: boardData.analytics,
      summary: boardData.summary,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const simulateTaskAssignment = async (req, res) => {
  if (req.user.roleName !== MANAGER_ROLE) return res.status(403).json({ message: 'Access denied' });

  const taskInput = normalizeTaskInput(req.body);
  const validationError = validateTaskInput(taskInput);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const boardData = await enrichManagerBoardData(req.user.id);
    const rankings = rankEmployeesForTask({
      employees: boardData.employees.map((employee) => employee.toJSON()),
      assignmentsByEmployee: boardData.assignmentsByEmployee,
      taskInput,
    });

    res.json({
      simulatedTask: {
        ...taskInput,
        requiredSkills: taskInput.requiredSkills,
      },
      rankings,
      bestMatch: rankings[0] || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getManagerAnalytics = async (req, res) => {
  if (req.user.roleName !== MANAGER_ROLE) return res.status(403).json({ message: 'Access denied' });

  try {
    const boardData = await enrichManagerBoardData(req.user.id);
    res.json({
      summary: boardData.summary,
      analytics: boardData.analytics,
      alerts: boardData.alerts,
      team: boardData.team,
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

      if (!task) throw new Error('Task not found');

      const boardData = await enrichManagerBoardData(req.user.id, transaction);
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
        const [bestMatch] = getTaskRecommendations(task, boardData.employees, boardData.assignmentsByEmployee);
        if (!bestMatch) {
          throw new Error('No employees available for smart assignment');
        }
        employee = boardData.employees.find((item) => item.id === bestMatch.employeeId) || null;
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

    res.json(buildTaskResponse(result.task, result.assignment, {
      assignee: {
        id: result.employee.id,
        fullName: result.employee.fullName,
      },
    }));
  } catch (err) {
    const statusCode = ['Task not found', 'Invalid employee or not under you', 'No employees available for smart assignment']
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
      const boardData = await enrichManagerBoardData(req.user.id, transaction);
      if (boardData.employees.length === 0) {
        throw new Error('No employees available for auto-assignment');
      }

      const createdAssignments = [];
      for (const task of boardData.unassignedTasks) {
        const [bestMatch] = rankEmployeesForTask({
          employees: boardData.employees.map((employee) => employee.toJSON()),
          assignmentsByEmployee: boardData.assignmentsByEmployee,
          taskInput: task,
        });
        if (!bestMatch) continue;

        const employee = boardData.employees.find((item) => item.id === bestMatch.employeeId);
        const assignment = await TaskAssignment.create({
          taskId: task.id,
          employeeId: employee.id,
          assignedBy: req.user.id,
          status: 'Pending',
          completionPercent: 0,
          isActive: true,
        }, { transaction });

        if (!boardData.assignmentsByEmployee[employee.id]) {
          boardData.assignmentsByEmployee[employee.id] = [];
        }
        boardData.assignmentsByEmployee[employee.id].push({
          ...assignment.toJSON(),
          task,
          employee,
        });

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
        ? `Smart-assigned ${result.length} backlog task${result.length === 1 ? '' : 's'} successfully`
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

    if (assignment.status === 'Completed' || assignment.completionPercent === 100) {
      assignment.status = 'Completed';
      assignment.completionPercent = 100;
      assignment.completedAt = new Date();
      assignment.isActive = false;
    } else {
      assignment.completedAt = null;
      assignment.isActive = true;
    }

    await assignment.save();
    res.json(buildTaskResponse(assignment.task, assignment));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export {
  assignTaskToEmployee,
  autoAssignBacklogTasks,
  createTask,
  getManagerAnalytics,
  getManagerTaskBoard,
  getMyTasks,
  simulateTaskAssignment,
  updateTaskStatus,
};
