import { Query, User } from '../models/index.js';

const EMPLOYEE_ROLE = 'employee';
const MANAGER_ROLE = 'manager';

const getEmployeeQueries = async (req, res) => {
  if (req.user.roleName !== EMPLOYEE_ROLE) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const queries = await Query.findAll({
      where: { employeeId: req.user.id },
      include: [{ model: User, as: 'queryManager', attributes: ['id', 'fullName', 'email'] }],
      order: [['createdAt', 'DESC']],
    });

    const unreadReplies = queries.filter((query) => query.reply && !query.isEmployeeRead).length;
    await Query.update(
      { isEmployeeRead: true },
      {
        where: {
          employeeId: req.user.id,
          isEmployeeRead: false,
        },
      }
    );

    res.json({ queries, unreadReplies });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createEmployeeQuery = async (req, res) => {
  if (req.user.roleName !== EMPLOYEE_ROLE) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { subject, message } = req.body;
  if (!subject?.trim() || !message?.trim()) {
    return res.status(400).json({ message: 'Subject and message are required' });
  }

  try {
    const employee = await User.findByPk(req.user.id);
    if (!employee?.managerId) {
      return res.status(400).json({ message: 'You are not assigned to any manager yet' });
    }

    const manager = await User.findByPk(employee.managerId);
    if (!manager) {
      return res.status(400).json({ message: 'Assigned manager not found' });
    }

    const query = await Query.create({
      employeeId: req.user.id,
      managerId: manager.id,
      subject: subject.trim(),
      message: message.trim(),
      status: 'Open',
      isManagerRead: false,
      isEmployeeRead: true,
    });

    res.status(201).json(query);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEmployeeUnreadCount = async (req, res) => {
  if (req.user.roleName !== EMPLOYEE_ROLE) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const unreadReplies = await Query.count({
      where: {
        employeeId: req.user.id,
        isEmployeeRead: false,
      },
    });

    res.json({ unreadReplies });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getManagerQueries = async (req, res) => {
  if (req.user.roleName !== MANAGER_ROLE) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const queries = await Query.findAll({
      where: { managerId: req.user.id },
      include: [{ model: User, as: 'employee', attributes: ['id', 'fullName', 'email'] }],
      order: [['createdAt', 'DESC']],
    });

    const unreadCount = queries.filter((query) => !query.isManagerRead).length;
    if (req.query.markRead === 'true') {
      await Query.update(
        { isManagerRead: true },
        { where: { managerId: req.user.id, isManagerRead: false } }
      );
    }

    res.json({ queries, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getManagerUnreadCount = async (req, res) => {
  if (req.user.roleName !== MANAGER_ROLE) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const unreadCount = await Query.count({
      where: { managerId: req.user.id, isManagerRead: false },
    });
    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const replyToQuery = async (req, res) => {
  if (req.user.roleName !== MANAGER_ROLE) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { id } = req.params;
  const { reply } = req.body;
  if (!reply?.trim()) {
    return res.status(400).json({ message: 'Reply is required' });
  }

  try {
    const query = await Query.findOne({
      where: { id, managerId: req.user.id },
      include: [{ model: User, as: 'employee', attributes: ['id', 'fullName', 'email'] }],
    });

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    await query.update({
      reply: reply.trim(),
      status: 'Answered',
      isManagerRead: true,
      isEmployeeRead: false,
    });

    res.json(query);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export {
  getEmployeeQueries,
  createEmployeeQuery,
  getEmployeeUnreadCount,
  getManagerQueries,
  getManagerUnreadCount,
  replyToQuery,
};
