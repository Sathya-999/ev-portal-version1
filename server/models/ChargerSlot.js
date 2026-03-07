import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ChargerSlot = sequelize.define('ChargerSlot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  slot_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'BOOKED', 'ACTIVE_CHARGING'),
    allowNull: false,
    defaultValue: 'AVAILABLE',
  },
  booked_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  booking_time: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  expiry_time: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'charger_slots',
  timestamps: true,
});

export default ChargerSlot;
