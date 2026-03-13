import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, Wallet } from '../models/index.js';
import { generateToken } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/emailService.js';

const router = Router();

// ─── POST /api/auth/signup ────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!firstName || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'firstName, email, and password are required.' });
    }

    // Check if user already exists
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      firstName,
      lastName: lastName || '',
      email: normalizedEmail,
      passwordHash,
      phone: phone || '',
    });

    // Create wallet with 0 balance
    await Wallet.create({ userId: user.id, balance: 0 });

    // Generate JWT
    const token = generateToken(user);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(normalizedEmail, firstName).catch(err =>
      console.warn('[Email] Welcome email failed:', err.message)
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        location: user.location,
        membership: user.membership,
        walletBalance: 0,
        loyaltyPoints: user.loyaltyPoints,
      },
    });
  } catch (err) {
    console.error('[Auth] Signup error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const user = await User.findOne({
      where: { email: normalizedEmail },
      include: [{ association: 'wallet', attributes: ['balance'] }],
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // If user signed up via Google OAuth (no password), require Google login
    if (!user.passwordHash) {
      return res.status(401).json({ error: 'This account uses Google sign-in. Please use Google to log in.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        location: user.location,
        membership: user.membership,
        walletBalance: parseFloat(user.wallet?.balance || 0),
        loyaltyPoints: user.loyaltyPoints,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/auth/google ────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required.' });
    }

    // Decode Google JWT (we trust the frontend GoogleLogin component for now)
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));

    const { email, given_name, family_name, sub, picture } = decoded;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Could not extract email from Google token.' });
    }

    // Find or create user
    let user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      user = await User.create({
        firstName: given_name || 'User',
        lastName: family_name || '',
        email: normalizedEmail,
        googleId: sub,
        picture: picture || '',
      });
      await Wallet.create({ userId: user.id, balance: 0 });

      sendWelcomeEmail(normalizedEmail, given_name || 'User').catch(err =>
        console.warn('[Email] Welcome email failed:', err.message)
      );
    } else {
      // Update Google fields if needed
      if (!user.googleId) {
        await user.update({ googleId: sub, picture: picture || user.picture });
      }
    }

    const wallet = await Wallet.findOne({ where: { userId: user.id } });

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        location: user.location,
        membership: user.membership,
        walletBalance: parseFloat(wallet?.balance || 0),
        loyaltyPoints: user.loyaltyPoints,
        picture: user.picture,
      },
    });
  } catch (err) {
    console.error('[Auth] Google auth error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
