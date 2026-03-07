import { Router } from 'express';
import { Station, ChargerSlot } from '../models/index.js';

const router = Router();

// ─── GET /api/stations — Fetch all stations from MySQL ────────
// Includes live slot counts from charger_slots table
router.get('/', async (req, res) => {
  try {
    const stations = await Station.findAll({
      order: [['station_name', 'ASC']],
    });

    // Fetch all slots in one query for efficiency
    const allSlots = await ChargerSlot.findAll({ attributes: ['station_id', 'status'] });

    const { lat, lng } = req.query;

    let result = stations.map(s => {
      const stSlots = allSlots.filter(sl => sl.station_id === s.id);
      const totalSlots = stSlots.length;
      const availableSlots = stSlots.filter(sl => sl.status === 'AVAILABLE').length;
      return {
        id: s.id,
        station_name: s.station_name,
        latitude: parseFloat(s.latitude),
        longitude: parseFloat(s.longitude),
        available_chargers: s.available_chargers,
        price_per_kwh: parseFloat(s.price_per_kwh),
        total_slots: totalSlots,
        available_slots: availableSlots,
      };
    });

    // If user location provided, calculate distance and sort nearest first
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      result = result.map(s => ({
        ...s,
        distance: haversine(userLat, userLng, s.latitude, s.longitude),
      })).sort((a, b) => a.distance - b.distance);
    }

    return res.json(result);
  } catch (err) {
    console.error('[Stations] Fetch error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Haversine Formula ────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // km, 1 decimal
}

export default router;
