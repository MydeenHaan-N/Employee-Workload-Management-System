const { DataTypes } = require('sequelize');
const sequelize  = require('../config/db');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  priority: {
    type: DataTypes.ENUM('High', 'Medium', 'Low'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Overdue'),
    defaultValue: 'Pending',
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Task;