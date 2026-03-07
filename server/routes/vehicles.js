import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { Vehicle } from '../models/index.js';

const router = Router();
router.use(authMiddleware);

// ─── GET /api/vehicles ────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    return res.json(
      vehicles.map(v => ({
        id: v.id,
        name: v.name,
        model: `${v.vehicleBrand} ${v.vehicleModel}`,
        vehicleBrand: v.vehicleBrand,
        vehicleModel: v.vehicleModel,
        batteryCapacity: v.batteryCapacity,
        connectorType: v.connectorType,
        currentSoc: v.currentSoc,
        regNo: v.regNo,
      }))
    );
  } catch (err) {
    console.error('[Vehicles] Fetch error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/vehicles ───────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { vehicleBrand, vehicleModel, batteryCapacity, connectorType, regNo, currentSoc } = req.body;

    if (!vehicleBrand || !vehicleModel) {
      return res.status(400).json({ error: 'vehicleBrand and vehicleModel are required.' });
    }

    const vehicle = await Vehicle.create({
      userId: req.user.id,
      name: `${vehicleBrand} ${vehicleModel}`,
      vehicleBrand,
      vehicleModel,
      batteryCapacity: batteryCapacity || 40.5,
      connectorType: connectorType || 'CCS2',
      currentSoc: currentSoc || 65,
      regNo: regNo || '',
    });

    return res.status(201).json({
      id: vehicle.id,
      name: vehicle.name,
      model: `${vehicle.vehicleBrand} ${vehicle.vehicleModel}`,
      vehicleBrand: vehicle.vehicleBrand,
      vehicleModel: vehicle.vehicleModel,
      batteryCapacity: vehicle.batteryCapacity,
      connectorType: vehicle.connectorType,
      currentSoc: vehicle.currentSoc,
      regNo: vehicle.regNo,
    });
  } catch (err) {
    console.error('[Vehicles] Create error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── DELETE /api/vehicles/:id ─────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

    await vehicle.destroy();
    return res.json({ message: 'Vehicle deleted.' });
  } catch (err) {
    console.error('[Vehicles] Delete error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
