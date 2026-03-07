import { Router } from 'express';
import { Op } from 'sequelize';
import { ChargerSlot } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// ─── Helper: expire stale bookings ───────────────────────────
async function expireStaleBookings() {
  const now = new Date();
  const [count] = await ChargerSlot.update(
    { status: 'AVAILABLE', booked_by_user_id: null, booking_time: null, expiry_time: null },
    {
      where: {
        status: 'BOOKED',
        expiry_time: { [Op.lt]: now },
      },
    }
  );
  if (count > 0) console.log(`[Slots] Expired ${count} stale booking(s).`);
  return count;
}

// ─── CRON: run expiry check every 60 seconds ─────────────────
setInterval(expireStaleBookings, 60_000);

// ─── GET /api/slots/:stationId — list slots for a station ────
router.get('/:stationId', async (req, res) => {
  try {
    await expireStaleBookings();

    const slots = await ChargerSlot.findAll({
      where: { station_id: req.params.stationId },
      order: [['slot_number', 'ASC']],
    });

    const result = slots.map(s => ({
      id: s.id,
      station_id: s.station_id,
      slot_number: s.slot_number,
      status: s.status,
      booked_by_user_id: s.booked_by_user_id,
      booking_time: s.booking_time,
      expiry_time: s.expiry_time,
    }));

    return res.json(result);
  } catch (err) {
    console.error('[Slots] Fetch error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/slots/:slotId/book — book a slot ──────────────
router.post('/:slotId/book', authMiddleware, async (req, res) => {
  try {
    const slot = await ChargerSlot.findByPk(req.params.slotId);
    if (!slot) return res.status(404).json({ error: 'Slot not found.' });

    if (slot.status !== 'AVAILABLE') {
      return res.status(409).json({ error: 'Slot is already booked or in use.' });
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + 15 * 60 * 1000);

    slot.status = 'BOOKED';
    slot.booked_by_user_id = req.user.id;
    slot.booking_time = now;
    slot.expiry_time = expiry;
    await slot.save();

    return res.json({
      message: 'Slot booked successfully.',
      slot: {
        id: slot.id,
        station_id: slot.station_id,
        slot_number: slot.slot_number,
        status: slot.status,
        booking_time: slot.booking_time,
        expiry_time: slot.expiry_time,
      },
    });
  } catch (err) {
    console.error('[Slots] Booking error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/slots/:slotId/confirm — QR arrival confirmation
router.post('/:slotId/confirm', authMiddleware, async (req, res) => {
  try {
    const slot = await ChargerSlot.findByPk(req.params.slotId);
    if (!slot) return res.status(404).json({ error: 'Slot not found.' });

    if (slot.booked_by_user_id !== req.user.id) {
      return res.status(403).json({ error: 'This slot was not booked by you.' });
    }

    if (slot.status !== 'BOOKED') {
      return res.status(409).json({ error: 'Slot is not in BOOKED state.' });
    }

    slot.status = 'ACTIVE_CHARGING';
    slot.expiry_time = null;
    await slot.save();

    return res.json({
      message: 'Arrival confirmed — charging active.',
      slot: {
        id: slot.id,
        station_id: slot.station_id,
        slot_number: slot.slot_number,
        status: slot.status,
      },
    });
  } catch (err) {
    console.error('[Slots] Confirm error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/slots/:slotId/release — end charging session ──
router.post('/:slotId/release', authMiddleware, async (req, res) => {
  try {
    const slot = await ChargerSlot.findByPk(req.params.slotId);
    if (!slot) return res.status(404).json({ error: 'Slot not found.' });

    if (slot.booked_by_user_id !== req.user.id) {
      return res.status(403).json({ error: 'This slot was not booked by you.' });
    }

    slot.status = 'AVAILABLE';
    slot.booked_by_user_id = null;
    slot.booking_time = null;
    slot.expiry_time = null;
    await slot.save();

    return res.json({ message: 'Slot released.', slot: { id: slot.id, status: 'AVAILABLE' } });
  } catch (err) {
    console.error('[Slots] Release error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
