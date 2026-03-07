import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { sequelize, Wallet, Transaction, ChargingHistory } from '../models/index.js';

const router = Router();
router.use(authMiddleware);

// ─── GET /api/wallet/balance ──────────────────────────────────
// Returns the authenticated user's wallet balance
router.get('/balance', async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ where: { userId: req.user.id } });

    // Auto-create wallet if it doesn't exist
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user.id, balance: 0 });
    }

    return res.json({ balance: parseFloat(wallet.balance || 0) });
  } catch (err) {
    console.error('[Wallet] Balance error:', err);
    return res.status(500).json({ error: 'Failed to fetch wallet balance.' });
  }
});

// ─── GET /api/wallet/transactions ─────────────────────────────
// Returns unified transaction history (top-ups + charging sessions)
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    const chargingSessions = await ChargingHistory.findAll({
      where: { userId: req.user.id },
      order: [['sessionDate', 'DESC']],
      limit: 100,
    });

    const unified = [];

    for (const tx of transactions) {
      unified.push({
        id: `tx_${tx.id}`,
        date: tx.createdAt.toISOString().split('T')[0],
        type: tx.type,
        station: tx.description || 'Wallet Recharge',
        amount: parseFloat(tx.amount),
        status: tx.status,
        method: tx.method,
      });
    }

    for (const ch of chargingSessions) {
      unified.push({
        id: `ch_${ch.id}`,
        date: ch.sessionDate,
        type: 'CHARGING',
        station: ch.stationName || 'Unknown Station',
        amount: parseFloat(ch.amountPaid),
        status: 'COMPLETED',
        method: 'Wallet',
      });
    }

    // Sort by date descending
    unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.json(unified);
  } catch (err) {
    console.error('[Wallet] Transactions error:', err);
    return res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

// ─── POST /api/wallet/pay ─────────────────────────────────────
// Deduct from wallet balance for charging payments
// ACID compliant — uses Sequelize managed transaction with row-level locking
router.post('/pay', async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { amount, stationName, description } = req.body;

    if (!amount || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'A valid positive amount is required.' });
    }

    // Lock the wallet row to prevent race conditions
    const wallet = await Wallet.findOne({
      where: { userId: req.user.id },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!wallet) {
      await t.rollback();
      return res.status(404).json({ error: 'Wallet not found. Please add money first.' });
    }

    const currentBalance = parseFloat(wallet.balance);
    if (currentBalance < amount) {
      await t.rollback();
      return res.status(400).json({
        error: 'Insufficient wallet balance.',
        balance: currentBalance,
        required: amount,
      });
    }

    // Deduct balance
    const newBalance = currentBalance - parseFloat(amount);
    await wallet.update({ balance: newBalance }, { transaction: t });

    // Record the transaction
    await Transaction.create({
      userId: req.user.id,
      amount: parseFloat(amount),
      type: 'CHARGING',
      status: 'COMPLETED',
      method: 'Wallet',
      description: description || `Charging at ${stationName || 'EV Station'}`,
    }, { transaction: t });

    await t.commit();
    console.log(`[Wallet] ✅ Deducted ₹${amount} from user ${req.user.id}. Balance: ₹${currentBalance} → ₹${newBalance}`);

    return res.json({
      success: true,
      walletBalance: newBalance,
      prevBalance: currentBalance,
      message: `₹${amount} deducted from wallet for charging.`,
    });
  } catch (err) {
    try { await t.rollback(); } catch (_) { /* already rolled back */ }
    console.error('[Wallet] Pay error:', err);
    return res.status(500).json({ error: 'Wallet payment failed. Amount NOT deducted.' });
  }
});

export default router;
