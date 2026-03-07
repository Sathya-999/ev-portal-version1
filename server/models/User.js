import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: '',
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: true, // null for Google OAuth users
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: '',
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'India',
  },
  membership: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'EV-Portal Premium',
  },
  loyaltyPoints: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  googleId: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  picture: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

export default User;
