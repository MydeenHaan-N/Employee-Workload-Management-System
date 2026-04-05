const  sequelize  = require('../config/db');
const Role = require('./Role');
const User = require('./User');
const Task = require('./Task');

// Associations
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'roleDetails' });

User.hasMany(Task, { foreignKey: 'assignedTo', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

User.hasMany(Task, { foreignKey: 'assignedBy', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'assignedBy', as: 'assigner' });

User.hasMany(User, { foreignKey: 'managerId', as: 'employees' });
User.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

module.exports = { User, Task, Role, sequelize };
