const { Task } = require('../models/index');
const { Op } = require('sequelize');

const priorityWeights = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const getWorkload = async (userId) => {
  const tasks = await Task.findAll({
    where: {
      assignedTo: userId,
      status: { [Op.in]: ['Pending', 'In Progress'] },
    },
  });

  const score = tasks.reduce((sum, task) => sum + priorityWeights[task.priority], 0);

  let level;
  if (score < 5) level = 'Low';
  else if (score < 10) level = 'Medium';
  else level = 'High';

  return { score, level };
};

module.exports = { getWorkload };