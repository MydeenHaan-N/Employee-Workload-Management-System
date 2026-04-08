import { Op } from 'sequelize';
import { Task, TaskAssignment } from '../models/index.js';
import { ACTIVE_STATUSES, buildEmployeeInsight, buildEscalationAlerts } from './workforceInsightsService.js';

const getWorkload = async (userId) => {
  const assignments = await TaskAssignment.findAll({
    where: {
      employeeId: userId,
      status: { [Op.in]: [...ACTIVE_STATUSES, 'Completed'] },
    },
    include: [{ model: Task, as: 'task', attributes: ['id', 'title', 'weight', 'priority', 'deadline', 'requiredSkills'] }],
    order: [[{ model: Task, as: 'task' }, 'deadline', 'ASC']],
  });

  const insight = buildEmployeeInsight({ id: userId, skills: [] }, assignments);
  const alerts = buildEscalationAlerts(assignments.filter((assignment) => assignment.isActive));

  let level;
  if (insight.workloadScore < 5) level = 'Low';
  else if (insight.workloadScore < 10) level = 'Medium';
  else level = 'High';

  return {
    score: insight.workloadScore,
    level,
    activeAssignments: insight.activeAssignments,
    burnoutRisk: insight.burnoutRisk,
    performance: insight.performance,
    alerts,
  };
};

export { getWorkload };
