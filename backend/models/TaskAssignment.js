import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const TaskAssignment = sequelize.define('TaskAssignment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Overdue'),
    allowNull: false,
    defaultValue: 'Pending',
  },
  completionPercent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  assignedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default TaskAssignment;
