import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { ChargingHistory } from '../models/index.js';

const router = Router();
router.use(authMiddleware);

// ─── GET /api/charging/history ────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const history = await ChargingHistory.findAll({
      where: { userId: req.user.id },
      order: [['sessionDate', 'DESC']],
      limit: 100,
    });

    return res.json(
      history.map(h => ({
        id: h.id,
        vehicle: h.vehicle,
        station: h.stationName,
        energy: h.energyUsedKwh,
        duration: h.duration,
        amount: parseFloat(h.amountPaid),
        date: h.sessionDate,
      }))
    );
  } catch (err) {
    console.error('[Charging] History error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/charging/session ───────────────────────────────
router.post('/session', async (req, res) => {
  try {
    const { vehicle, stationName, energyUsedKwh, duration, amountPaid, sessionDate } = req.body;

    if (!stationName || !energyUsedKwh) {
      return res.status(400).json({ error: 'stationName and energyUsedKwh are required.' });
    }

    const session = await ChargingHistory.create({
      userId: req.user.id,
      vehicle: vehicle || '',
      stationName,
      energyUsedKwh: parseFloat(energyUsedKwh),
      duration: duration || '',
      amountPaid: parseFloat(amountPaid || 0),
      sessionDate: sessionDate || new Date().toISOString().split('T')[0],
    });

    return res.status(201).json({
      id: session.id,
      vehicle: session.vehicle,
      station: session.stationName,
      energy: session.energyUsedKwh,
      duration: session.duration,
      amount: parseFloat(session.amountPaid),
      date: session.sessionDate,
    });
  } catch (err) {
    console.error('[Charging] Session create error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
