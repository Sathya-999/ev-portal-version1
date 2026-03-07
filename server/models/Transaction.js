import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Transaction = sequelize.define('Transaction', {
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
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('TOPUP', 'CHARGING', 'REFUND'),
    allowNull: false,
    defaultValue: 'TOPUP',
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
    allowNull: false,
    defaultValue: 'COMPLETED',
  },
  razorpayOrderId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  razorpayPaymentId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  method: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'UPI',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'Wallet Top-up',
  },
}, {
  tableName: 'transactions',
  timestamps: true,
});

export default Transaction;
