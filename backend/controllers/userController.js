const bcrypt = require('bcrypt');
const { User } = require('../models/index');

const createUser = async (req, res) => {
  const { fullName, email, password, role, managerId } = req.body;
  const { role: creatorRole, id: creatorId } = req.user;

  try {
    if (creatorRole === 'employee') return res.status(403).json({ message: 'Access denied' });

    if (creatorRole === 'manager' && (role !== 'employee' || managerId !== creatorId)) {
      return res.status(403).json({ message: 'Managers can only create employees under themselves' });
    }

    if (creatorRole === 'admin' && role === 'employee' && managerId) {
      const manager = await User.findByPk(managerId);
      if (!manager || manager.role !== 'manager') return res.status(400).json({ message: 'Invalid manager' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({ fullName, email, passwordHash, role, managerId });
    res.status(201).json(user);
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
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createUser, getMe, getAllUsers };