import sequelize from '../config/db.js';
import User from './User.js';
import Vehicle from './Vehicle.js';
import Wallet from './Wallet.js';
import Transaction from './Transaction.js';
import ChargingHistory from './ChargingHistory.js';
import Station from './Station.js';
import ChargerSlot from './ChargerSlot.js';

// ─── Associations ─────────────────────────────────────────────

// User has many Vehicles
User.hasMany(Vehicle, { foreignKey: 'userId', as: 'vehicles', onDelete: 'CASCADE' });
Vehicle.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User has one Wallet
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet', onDelete: 'CASCADE' });
Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User has many Transactions
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User has many ChargingHistory entries
User.hasMany(ChargingHistory, { foreignKey: 'userId', as: 'chargingHistory', onDelete: 'CASCADE' });
ChargingHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Station has many ChargerSlots
Station.hasMany(ChargerSlot, { foreignKey: 'station_id', as: 'slots', onDelete: 'CASCADE' });
ChargerSlot.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });

// ─── Sync Helper ──────────────────────────────────────────────
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection established successfully.');
    
    // alter:true updates tables without dropping — safe for dev
    await sequelize.sync({ alter: true, ...options });
    console.log('✅ All models synchronized.');
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    throw error;
  }
};

export { sequelize, User, Vehicle, Wallet, Transaction, ChargingHistory, Station, ChargerSlot, syncDatabase };
