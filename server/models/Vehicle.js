import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Vehicle = sequelize.define('Vehicle', {
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
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  vehicleBrand: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Tata',
  },
  vehicleModel: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Nexon EV',
  },
  batteryCapacity: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 40.5,
  },
  connectorType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'CCS2',
  },
  currentSoc: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 65,
  },
  regNo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '',
  },
}, {
  tableName: 'vehicles',
  timestamps: true,
});

export default Vehicle;
