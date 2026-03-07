import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/auth.js';
import { User, Wallet, Vehicle, ChargingHistory } from '../models/index.js';

const router = Router();

// All routes here require authentication
router.use(authMiddleware);

// ─── GET /api/user/me ─────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { association: 'wallet', attributes: ['balance'] },
      ],
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      location: user.location,
      membership: user.membership,
      walletBalance: parseFloat(user.wallet?.balance || 0),
      loyaltyPoints: user.loyaltyPoints,
      picture: user.picture,
      vehicleBrand: '',
      vehicleModel: '',
    });
  } catch (err) {
    console.error('[User] Fetch me error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── PATCH /api/user/update ───────────────────────────────────
router.patch('/update', async (req, res) => {
  try {
    const { firstName, lastName, phone, location, email } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    // Email change is risky — only allow if not taken
    if (email && email !== user.email) {
      const taken = await User.findOne({ where: { email } });
      if (taken) return res.status(409).json({ error: 'Email already in use.' });
      user.email = email;
    }

    await user.save();

    const wallet = await Wallet.findOne({ where: { userId: user.id } });

    return res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      location: user.location,
      membership: user.membership,
      walletBalance: parseFloat(wallet?.balance || 0),
      loyaltyPoints: user.loyaltyPoints,
    });
  } catch (err) {
    console.error('[User] Update error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── PATCH /api/user/password ─────────────────────────────────
router.patch('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.passwordHash) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required.' });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[User] Password change error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
