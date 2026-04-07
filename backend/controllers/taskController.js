const { Task, User } = require('../models/index');

const createTask = async (req, res) => {
  const { title, description, priority, deadline, assignedTo } = req.body;
  const assignedBy = req.user.id;

  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Access denied' });

  try {
    let nextAssignedTo = null;

    if (assignedTo) {
      const employee = await User.findByPk(assignedTo);
      if (!employee || employee.role !== 'employee' || employee.managerId !== assignedBy) {
        return res.status(400).json({ message: 'Invalid employee or not under you' });
      }

      nextAssignedTo = assignedTo;
    }

    const task = await Task.create({
      title,
      description,
      priority,
      deadline,
      assignedTo: nextAssignedTo,
      assignedBy,
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyTasks = async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ message: 'Access denied' });

  try {
    const tasks = await Task.findAll({ where: { assignedTo: req.user.id } });

    // Auto-mark overdue
    const today = new Date();
    for (let task of tasks) {
      if (task.deadline < today && task.status !== 'Completed' && task.status !== 'Overdue') {
        task.status = 'Overdue';
        await task.save();
      }
    }

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (req.user.role !== 'employee') return res.status(403).json({ message: 'Access denied' });

  try {
    const task = await Task.findByPk(id);
    if (!task || task.assignedTo !== req.user.id) return res.status(404).json({ message: 'Task not found' });

    task.status = status;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createTask, getMyTasks, updateTaskStatus };
