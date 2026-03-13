import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Support DATABASE_URL (Railway/Render) or individual vars (local)
let sequelize;

if (process.env.DATABASE_URL) {
  // Auto-detect dialect from URL (postgres:// or mysql://)
  const dialect = process.env.DATABASE_URL.startsWith('postgres') ? 'postgres' : 'mysql';
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'ev_portal',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || 'root',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

export default sequelize;
