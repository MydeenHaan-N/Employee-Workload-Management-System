const { Role } = require('../models');

const getAllRoles = async (_req, res) => {
  try {
    const roles = await Role.findAll({ order: [['name', 'ASC']] });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createRole = async (req, res) => {
  const { name, description } = req.body;

  try {
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const role = await Role.create({
      name,
      description: description?.trim() || null,
    });

    res.status(201).json(role);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Role already exists' });
    }

    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllRoles,
  createRole,
};
