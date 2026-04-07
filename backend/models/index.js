import sequelize from '../config/db.js';
import Role from './Role.js';
import User from './User.js';
import Task from './Task.js';
import TaskAssignment from './TaskAssignment.js';

Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'roleDetails' });

User.hasMany(Task, { foreignKey: 'assignedBy', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'assignedBy', as: 'assigner' });

Task.hasMany(TaskAssignment, { foreignKey: 'taskId', as: 'assignments' });
TaskAssignment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

User.hasMany(TaskAssignment, { foreignKey: 'employeeId', as: 'taskAssignments' });
TaskAssignment.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' });

User.hasMany(TaskAssignment, { foreignKey: 'assignedBy', as: 'createdAssignments' });
TaskAssignment.belongsTo(User, { foreignKey: 'assignedBy', as: 'manager' });

User.hasMany(User, { foreignKey: 'managerId', as: 'employees' });
User.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

export { User, Task, TaskAssignment, Role, sequelize };

export default { User, Task, TaskAssignment, Role, sequelize };
