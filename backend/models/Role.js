import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue('name', value?.toLowerCase().trim());
    },
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default Role;
