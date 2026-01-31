const  sequelize  = require('../config/db');
const User = require('./User');
const Task = require('./Task');

// Associations
User.hasMany(Task, { foreignKey: 'assignedTo', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

User.hasMany(Task, { foreignKey: 'assignedBy', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'assignedBy', as: 'assigner' });

User.hasMany(User, { foreignKey: 'managerId', as: 'employees' });
User.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

module.exports = { User, Task, sequelize };