import { Op } from 'sequelize';
import { Task, TaskAssignment } from '../models/index.js';

const getWorkload = async (userId) => {
  const assignments = await TaskAssignment.findAll({
    where: {
      employeeId: userId,
      isActive: true,
      status: { [Op.in]: ['Pending', 'In Progress', 'Overdue'] },
    },
    include: [{ model: Task, as: 'task', attributes: ['weight'] }],
  });

  const score = assignments.reduce((sum, assignment) => {
    const weight = assignment.task?.weight ?? 1;
    return sum + (weight * (1 - ((assignment.completionPercent || 0) / 100)));
  }, 0);

  let level;
  if (score < 5) level = 'Low';
  else if (score < 10) level = 'Medium';
  else level = 'High';

  return {
    score,
    level,
    activeAssignments: assignments.length,
  };
};

export { getWorkload };
