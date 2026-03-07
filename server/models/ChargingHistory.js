import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ChargingHistory = sequelize.define('ChargingHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  vehicle: {
    type: DataTypes.STRING(200),
    allowNull: true,
    defaultValue: '',
  },
  stationName: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  energyUsedKwh: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  duration: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '',
  },
  amountPaid: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  sessionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'charging_history',
  timestamps: true,
});

export default ChargingHistory;
