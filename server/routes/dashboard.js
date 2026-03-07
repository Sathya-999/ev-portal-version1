import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { User, Wallet, Vehicle, ChargingHistory } from '../models/index.js';

const router = Router();
router.use(authMiddleware);

// ─── GET /api/dashboard/summary ───────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;

    const wallet = await Wallet.findOne({ where: { userId } });
    const history = await ChargingHistory.findAll({ where: { userId } });
    const vehicles = await Vehicle.findAll({ where: { userId } });

    const totalEnergy = history.reduce((sum, h) => sum + (h.energyUsedKwh || 0), 0);
    const totalSessions = history.length;
    const totalSpent = history.reduce((sum, h) => sum + parseFloat(h.amountPaid || 0), 0);

    // Hardcoded station counts from the frontend charger dataset
    const totalStations = 22;
    const activeStations = 18;

    return res.json({
      activeStations,
      totalStations,
      totalEnergy: Math.round(totalEnergy * 10) / 10,
      totalSessions,
      totalSpent: Math.round(totalSpent * 100) / 100,
      walletBalance: parseFloat(wallet?.balance || 0),
      vehicleCount: vehicles.length,
    });
  } catch (err) {
    console.error('[Dashboard] Summary error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
