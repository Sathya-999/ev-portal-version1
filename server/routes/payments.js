import { Router } from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { sequelize, Wallet, Transaction, ChargingHistory } from '../models/index.js';
import { sendPaymentConfirmationEmail } from '../services/emailService.js';
import { User } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
router.use(authMiddleware);

// ─── RBI Compliance Constants ─────────────────────────────────
const RBI_MIN_TXN = 1;
const RBI_MAX_UPI_TXN = 100000;
const RBI_DAILY_LIMIT = 500000; // ₹5,00,000 daily UPI limit

// ─── GET /api/payments/wallet ─────────────────────────────────
router.get('/wallet', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    return res.json({ balance: parseFloat(wallet?.balance || 0) });
  } catch (err) {
    console.error('[Payments] Wallet error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── GET /api/payments/history ────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    // Get both transactions and charging history
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const chargingSessions = await ChargingHistory.findAll({
      where: { userId: req.user.id },
      order: [['sessionDate', 'DESC']],
      limit: 50,
    });

    // Merge into a unified format the frontend expects
    const unified = [];

    for (const tx of transactions) {
      unified.push({
        id: `tx_${tx.id}`,
        vehicle: 'STREET_WALLET',
        station: 'RAZORPAY_GATEWAY',
        energy: 0,
        duration: 'INSTANT',
        amount: parseFloat(tx.amount),
        date: tx.createdAt.toISOString().split('T')[0],
        type: tx.type,
        method: tx.method,
        status: tx.status,
      });
    }

    for (const ch of chargingSessions) {
      unified.push({
        id: `ch_${ch.id}`,
        vehicle: ch.vehicle,
        station: ch.stationName,
        energy: ch.energyUsedKwh,
        duration: ch.duration,
        amount: parseFloat(ch.amountPaid),
        date: ch.sessionDate,
        type: 'CHARGING',
        method: 'Wallet',
        status: 'COMPLETED',
      });
    }

    // Sort by date descending
    unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.json(unified);
  } catch (err) {
    console.error('[Payments] History error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/payments/create-order ──────────────────────────
router.post('/create-order', async (req, res) => {
  try {
    const { amount, purpose } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'A positive amount is required.' });
    }

    // Try real Razorpay if keys are configured
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret && !keyId.includes('XXXX')) {
      // Real Razorpay order creation
      const Razorpay = (await import('razorpay')).default;
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // paise
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: { purpose: purpose || 'Wallet Top-up', userId: String(req.user.id) },
      });

      return res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        keyId, // frontend needs this to open Razorpay popup
      });
    }

    // ─── Simulation mode (no real Razorpay keys) ──────────────
    const orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    return res.json({
      id: orderId,
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      status: 'created',
      keyId: null, // signals frontend to use QR simulation
    });
  } catch (err) {
    console.error('[Payments] Create order error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/payments/confirm ───────────────────────────────
// ACID COMPLIANT: Uses Sequelize managed transactions
// A — Atomicity: Wallet credit + Transaction record in single unit
// C — Consistency: RBI limits validated before commit
// I — Isolation: Row-level lock on wallet (SELECT FOR UPDATE)
// D — Durability: MySQL InnoDB commit guarantees persistence
router.post('/confirm', async (req, res) => {
  console.log('[Payments] /confirm called with body:', JSON.stringify(req.body));
  console.log('[Payments] User ID:', req.user?.id);
  
  // Start a managed transaction — auto rollback on error
  const t = await sequelize.transaction();

  try {
    const { orderId, paymentId, signature, amount } = req.body;

    // ─── RBI Compliance Checks (Consistency) ────────────────
    if (!amount || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'A valid amount is required.' });
    }
    if (amount < RBI_MIN_TXN) {
      await t.rollback();
      return res.status(400).json({ error: `Minimum ₹${RBI_MIN_TXN} per RBI guidelines.` });
    }
    if (amount > RBI_MAX_UPI_TXN) {
      await t.rollback();
      return res.status(400).json({ error: `UPI capped at ₹${RBI_MAX_UPI_TXN.toLocaleString('en-IN')} per RBI circular.` });
    }

    // ─── Daily Limit Check (RBI Compliance) ─────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyTotal = await Transaction.sum('amount', {
      where: {
        userId: req.user.id,
        type: 'TOPUP',
        status: 'COMPLETED',
        createdAt: { [sequelize.Sequelize.Op.gte]: today },
      },
      transaction: t,
    });
    if ((parseFloat(dailyTotal || 0) + parseFloat(amount)) > RBI_DAILY_LIMIT) {
      await t.rollback();
      return res.status(400).json({ error: `Daily UPI limit ₹${RBI_DAILY_LIMIT.toLocaleString('en-IN')} exceeded (RBI).` });
    }

    // ─── Idempotency Check — prevent duplicate txn ──────────
    if (orderId) {
      const existing = await Transaction.findOne({
        where: { razorpayOrderId: orderId, status: 'COMPLETED' },
        transaction: t,
      });
      if (existing) {
        await t.rollback();
        return res.status(409).json({ error: 'Transaction already processed (idempotency check).' });
      }
    }

    // Verify Razorpay signature if keys are configured
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret && !keySecret.includes('XXXX') && orderId && paymentId && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (expectedSignature !== signature) {
        await t.rollback();
        return res.status(400).json({ error: 'Payment verification failed — signature mismatch.' });
      }
    }

    // ─── ACID: Isolation — lock wallet row (SELECT FOR UPDATE) ──
    let wallet = await Wallet.findOne({
      where: { userId: req.user.id },
      lock: t.LOCK.UPDATE, // Row-level lock — prevents race conditions
      transaction: t,
    });

    // Auto-create wallet if it doesn't exist (handles edge cases like
    // Google OAuth users who signed up before wallet feature existed)
    if (!wallet) {
      wallet = await Wallet.create(
        { userId: req.user.id, balance: 0 },
        { transaction: t }
      );
      console.log(`[ACID] Auto-created wallet for user ${req.user.id}`);
    }

    // ─── ACID: Atomicity — credit wallet ────────────────────
    const prevBalance = parseFloat(wallet.balance);
    const newBalance = prevBalance + parseFloat(amount);
    await wallet.update({ balance: newBalance }, { transaction: t });

    // ─── ACID: Atomicity — record transaction ───────────────
    await Transaction.create({
      userId: req.user.id,
      amount: parseFloat(amount),
      type: 'TOPUP',
      status: 'COMPLETED',
      razorpayOrderId: orderId || null,
      razorpayPaymentId: paymentId || null,
      method: 'UPI',
      description: `Wallet Top-up via PhonePe (ACID Txn)`,
    }, { transaction: t });

    // ─── ACID: Durability — commit to InnoDB ────────────────
    await t.commit();
    console.log(`[ACID] ✅ COMMITTED: User ${req.user.id} credited ₹${amount}. Balance: ₹${prevBalance} → ₹${newBalance}`);

    // Send confirmation email (non-blocking, outside transaction)
    const user = await User.findByPk(req.user.id);
    if (user) {
      sendPaymentConfirmationEmail(user.email, user.firstName, parseFloat(amount), newBalance).catch(err =>
        console.warn('[Email] Payment confirmation failed:', err.message)
      );
    }

    return res.json({
      success: true,
      walletBalance: newBalance,
      prevBalance,
      message: `₹${amount} credited to wallet successfully. (ACID Committed)`,
      acid: { atomicity: true, consistency: true, isolation: true, durability: true },
    });
  } catch (err) {
    // ─── ACID: Rollback on ANY error ────────────────────────
    try { await t.rollback(); } catch (rbErr) { /* already rolled back */ }
    console.error('[ACID] ❌ ROLLBACK:', err.message);
    return res.status(500).json({ error: 'Transaction failed. Amount NOT debited. (ACID Rollback)' });
  }
});

export default router;
