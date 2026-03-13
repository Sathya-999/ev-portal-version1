import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { syncDatabase } from './models/index.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import dashboardRoutes from './routes/dashboard.js';
import paymentsRoutes from './routes/payments.js';
import vehiclesRoutes from './routes/vehicles.js';
import chargingRoutes from './routes/charging.js';
import stationsRoutes from './routes/stations.js';
import chatbotRoutes from './routes/chatbot.js';
import slotsRoutes from './routes/slots.js';
import walletRoutes from './routes/wallet.js';
import { sendPasswordResetEmail } from './services/emailService.js';
import { Station, ChargerSlot, User, Wallet } from './models/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/charging', chargingRoutes);
app.use('/api/stations', stationsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/wallet', walletRoutes);

// ─── Password Reset (public endpoint — no auth required) ─────
app.post('/api/send-reset-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    if (!to) return res.status(400).json({ error: 'Recipient email required.' });

    // Use the html from the frontend or a default
    await sendPasswordResetEmail(to, html || '');
    return res.json({ success: true, id: `msg_${Date.now()}` });
  } catch (err) {
    console.error('[Email] Reset email error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 404 Catch-All ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start Server ─────────────────────────────────────────────
const start = async () => {
  try {
    await syncDatabase();

    // ─── Seed stations if table is empty ────────────────────
    const stationCount = await Station.count();
    if (stationCount === 0) {
      console.log('[Seed] Inserting charging stations...');
      await Station.bulkCreate([
        { station_name: "TNEB Fast Charge — Guindy", latitude: 13.0067, longitude: 80.2206, available_chargers: 3, price_per_kwh: 14.00 },
        { station_name: "Adyar EV Hub", latitude: 13.0033, longitude: 80.2550, available_chargers: 1, price_per_kwh: 12.50 },
        { station_name: "Marina Beach Solar Charge", latitude: 13.0500, longitude: 80.2824, available_chargers: 2, price_per_kwh: 11.00 },
        { station_name: "Anna Nagar Supercharger", latitude: 13.0850, longitude: 80.2101, available_chargers: 6, price_per_kwh: 18.50 },
        { station_name: "OMR Tech Park EV Station", latitude: 12.9249, longitude: 80.2272, available_chargers: 2, price_per_kwh: 15.00 },
        { station_name: "T. Nagar Tata Power Hub", latitude: 13.0418, longitude: 80.2341, available_chargers: 3, price_per_kwh: 16.00 },
        { station_name: "Tambaram BESCOM Station", latitude: 12.9249, longitude: 80.1185, available_chargers: 0, price_per_kwh: 10.50 },
        { station_name: "Coimbatore RS Puram Charge Point", latitude: 11.0168, longitude: 76.9558, available_chargers: 2, price_per_kwh: 13.00 },
        { station_name: "Gandhipuram EV Fast Charge", latitude: 11.0183, longitude: 76.9725, available_chargers: 4, price_per_kwh: 15.50 },
        { station_name: "Madurai Meenakshi EV Hub", latitude: 9.9252, longitude: 78.1198, available_chargers: 2, price_per_kwh: 12.00 },
        { station_name: "Madurai Bypass Tata Power", latitude: 9.9391, longitude: 78.0747, available_chargers: 3, price_per_kwh: 14.50 },
        { station_name: "Tata Power EZ Charge — MG Road", latitude: 12.9716, longitude: 77.5946, available_chargers: 3, price_per_kwh: 18.50 },
        { station_name: "Jio-bp Pulse Hub — Koramangala", latitude: 12.9352, longitude: 77.6245, available_chargers: 1, price_per_kwh: 15.00 },
        { station_name: "Ather Grid — Indiranagar", latitude: 12.9816, longitude: 77.6408, available_chargers: 5, price_per_kwh: 22.00 },
        { station_name: "HMDA EV Hub — Gachibowli", latitude: 17.4400, longitude: 78.3489, available_chargers: 3, price_per_kwh: 16.00 },
        { station_name: "Hitech City Charge Station", latitude: 17.4486, longitude: 78.3908, available_chargers: 2, price_per_kwh: 14.50 },
        { station_name: "BEST EV Station — Bandra", latitude: 19.0596, longitude: 72.8295, available_chargers: 4, price_per_kwh: 20.00 },
        { station_name: "Tata Power — Andheri", latitude: 19.1136, longitude: 72.8697, available_chargers: 2, price_per_kwh: 17.50 },
        { station_name: "EESL Charge Point — Connaught Place", latitude: 28.6315, longitude: 77.2167, available_chargers: 3, price_per_kwh: 16.50 },
        { station_name: "Fortum Charge — Gurugram Cyber Hub", latitude: 28.4949, longitude: 77.0890, available_chargers: 5, price_per_kwh: 19.00 },
        { station_name: "Trichy TNEB SmartCharge", latitude: 10.7905, longitude: 78.7047, available_chargers: 2, price_per_kwh: 11.50 },
        { station_name: "Salem Highway EV Point", latitude: 11.6643, longitude: 78.1460, available_chargers: 2, price_per_kwh: 12.00 },
      ]);
      console.log('[Seed] ✅ 22 charging stations inserted.');
    }

    // ─── Seed charger slots (4 per station) if table is empty ──
    const slotCount = await ChargerSlot.count();
    if (slotCount === 0) {
      console.log('[Seed] Inserting charger slots...');
      const allStations = await Station.findAll({ attributes: ['id'] });
      const slotRows = [];
      for (const st of allStations) {
        for (let n = 1; n <= 4; n++) {
          slotRows.push({ station_id: st.id, slot_number: n, status: 'AVAILABLE' });
        }
      }
      await ChargerSlot.bulkCreate(slotRows);
      console.log(`[Seed] ✅ ${slotRows.length} charger slots inserted (4 per station).`);
    }

    // ─── Seed test user if none exist ────────────────────────
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('[Seed] Creating test user...');
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.default.hash('password123', 12);
      const testUser = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        passwordHash: passwordHash,
        phone: '+91 9000000000',
      });
      await Wallet.create({ userId: testUser.id, balance: 500 });
      console.log(`[Seed] ✅ Test user created: test@example.com / password123`);
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 EV-Portal API Server running at http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.log('\n💡 Tip: Make sure MySQL is running and the ev_portal database exists.');
    console.log('   Run: CREATE DATABASE ev_portal; in your MySQL client.\n');
    process.exit(1);
  }
};

start();
