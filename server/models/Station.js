import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Station = sequelize.define('Station', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  station_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
  },
  available_chargers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  price_per_kwh: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 12.50,
  },
}, {
  tableName: 'stations',
  timestamps: true,
});

export default Station;
