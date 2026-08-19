const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const customerAuthMiddleware = require('../middleware/customerAuth');

const Restaurant = require('../models/Restaurant');
const Setting = require('../models/Setting');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const WalletTopUpRequest = require('../models/WalletTopUpRequest');

// ─── Helper ──────────────────────────────────────────────────────────────────

async function getOrCreateWallet(customerId) {
  let wallet = await Wallet.findOne({ customerId });
  if (!wallet) {
    wallet = new Wallet({ customerId, balance: 0, currency: 'INR', isActive: true });
    await wallet.save();
  }
  return wallet;
}

// ─── PUBLIC / CUSTOMER PAYMENT SETTINGS ──────────────────────────────────────

/**
 * GET /api/wallet-topups/payment-settings
 * Returns Super Admin platform UPI payment settings for global customer wallet top-ups.
 */
router.get('/payment-settings', async (req, res) => {
  try {
    const upiIdSetting = await Setting.findOne({ key: 'superadmin_upi_id', restaurantId: null });
    const upiNameSetting = await Setting.findOne({ key: 'superadmin_upi_name', restaurantId: null });
    const upiQrSetting = await Setting.findOne({ key: 'superadmin_upi_qr_url', restaurantId: null });

    const config = {
      restaurantName: 'Bombay Chowpati Central Platform',
      upi_id: upiIdSetting?.value || 'superadmin@upi',
      upi_name: upiNameSetting?.value || 'Bombay Chowpati Central',
      upi_qr_url: upiQrSetting?.value || '',
      is_payment_enabled: true
    };

    res.json(config);
  } catch (err) {
    console.error('Get payment settings error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────

/**
 * POST /api/wallet-topups/request
 * Customer submits a top-up request to SUPER ADMIN after paying via UPI.
 * Creates WalletTopUpRequest with status PENDING — wallet is NOT credited until Super Admin verifies.
 */
router.post('/request', customerAuthMiddleware, async (req, res) => {
  const { amount, utrNumber, paymentDate, customerNote, restaurantId } = req.body;

  if (!amount || !utrNumber || !paymentDate) {
    return res.status(400).json({ message: 'Amount, UTR number, and payment date are required.' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number.' });
  }

  if (!utrNumber.trim()) {
    return res.status(400).json({ message: 'UTR / Transaction ID is required.' });
  }

  try {
    // Get Super Admin UPI ID snapshot
    const upiIdSetting = await Setting.findOne({ key: 'superadmin_upi_id', restaurantId: null });
    const upiId = upiIdSetting?.value || 'superadmin@upi';

    // Check for duplicate UTR in confirmed requests (prevent double-credit fraud)
    const duplicateUTR = await WalletTopUpRequest.findOne({
      utrNumber: utrNumber.trim(),
      status: 'CONFIRMED'
    });
    if (duplicateUTR) {
      return res.status(400).json({ message: 'This UTR / Transaction ID has already been used for a confirmed top-up.' });
    }

    // Get/create wallet (just to store walletId reference)
    const wallet = await getOrCreateWallet(req.customer.id);

    const request = new WalletTopUpRequest({
      customerId: req.customer.id,
      restaurantId: restaurantId || null,
      walletId: wallet._id,
      amount: parsedAmount,
      upiId,
      utrNumber: utrNumber.trim(),
      paymentDate: new Date(paymentDate),
      customerNote: customerNote || '',
      status: 'PENDING'
    });

    await request.save();

    res.status(201).json({
      success: true,
      message: 'Payment request submitted to Super Admin! Your wallet will be credited once verified.',
      request: {
        id: request._id,
        amount: request.amount,
        utrNumber: request.utrNumber,
        status: request.status,
        createdAt: request.createdAt
      }
    });
  } catch (err) {
    console.error('Submit top-up request error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * GET /api/wallet-topups/my-requests
 * Customer's own top-up request history.
 */
router.get('/my-requests', customerAuthMiddleware, async (req, res) => {
  try {
    const requests = await WalletTopUpRequest.find({ customerId: req.customer.id })
      .sort({ createdAt: -1 });

    const formatted = requests.map(r => ({
      id: r._id,
      amount: r.amount,
      restaurantName: 'Bombay Chowpati Central',
      utrNumber: r.utrNumber,
      paymentDate: r.paymentDate,
      customerNote: r.customerNote,
      status: r.status,
      rejectionReason: r.rejectionReason,
      verifiedAt: r.verifiedAt,
      createdAt: r.createdAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Get my top-up requests error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ─── SUPER ADMIN ONLY (Platform-Wide Wallet Top-Up Management) ───────────────

const superAdminOnly = [auth, authorizeRoles('super_admin')];

/**
 * GET /api/wallet-topups/superadmin/requests
 * Super Admin lists all student wallet top-up requests platform-wide.
 */
router.get('/superadmin/requests', ...superAdminOnly, async (req, res) => {
  try {
    const { status } = req.query; // optional filter: PENDING | CONFIRMED | REJECTED
    const filter = {};
    if (status && ['PENDING', 'CONFIRMED', 'REJECTED'].includes(status)) {
      filter.status = status;
    }

    const requests = await WalletTopUpRequest.find(filter)
      .populate('customerId', 'name phone email')
      .populate('verifiedBy', 'username')
      .sort({ createdAt: -1 });

    const formatted = requests.map(r => ({
      id: r._id,
      customerName: r.customerId?.name || 'Unknown Customer',
      customerPhone: r.customerId?.phone || 'N/A',
      customerEmail: r.customerId?.email || '',
      amount: r.amount,
      upiId: r.upiId,
      utrNumber: r.utrNumber,
      paymentDate: r.paymentDate,
      customerNote: r.customerNote,
      status: r.status,
      rejectionReason: r.rejectionReason,
      verifiedBy: r.verifiedBy?.username || null,
      verifiedAt: r.verifiedAt,
      createdAt: r.createdAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Get superadmin top-up requests error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * POST /api/wallet-topups/superadmin/:id/confirm
 * Super Admin confirms student top-up payment → atomically credits customer wallet.
 */
router.post('/superadmin/:id/confirm', ...superAdminOnly, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const request = await WalletTopUpRequest.findById(req.params.id).session(session);
    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Top-up request not found.' });
    }

    if (request.status !== 'PENDING') {
      await session.abortTransaction();
      return res.status(400).json({ message: `Cannot confirm: request is already ${request.status}.` });
    }

    // UTR uniqueness check among confirmed requests
    const duplicateUTR = await WalletTopUpRequest.findOne({
      utrNumber: request.utrNumber,
      status: 'CONFIRMED',
      _id: { $ne: request._id }
    }).session(session);

    if (duplicateUTR) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'This UTR has already been used for another confirmed top-up.' });
    }

    // Get or create customer wallet
    let wallet = await Wallet.findById(request.walletId).session(session);
    if (!wallet) {
      wallet = await Wallet.findOne({ customerId: request.customerId }).session(session);
    }
    if (!wallet) {
      wallet = new Wallet({ customerId: request.customerId, balance: 0, currency: 'INR', isActive: true });
      await wallet.save({ session });
    }

    // Credit wallet
    const balanceBefore = wallet.balance || 0;
    const balanceAfter = Math.round((balanceBefore + request.amount) * 100) / 100;
    wallet.balance = balanceAfter;
    await wallet.save({ session });

    // Create WalletTransaction audit record
    const transaction = new WalletTransaction({
      walletId: wallet._id,
      customerId: request.customerId,
      type: 'CREDIT',
      amount: request.amount,
      balanceBefore,
      balanceAfter,
      referenceType: 'WALLET_TOPUP',
      referenceId: request._id,
      description: `Manual UPI top-up confirmed by Super Admin — UTR: ${request.utrNumber}`,
      status: 'SUCCESS'
    });
    await transaction.save({ session });

    // Mark request as CONFIRMED
    request.status = 'CONFIRMED';
    request.verifiedBy = req.user.id;
    request.verifiedAt = new Date();
    request.walletTransactionId = transaction._id;
    await request.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: `₹${request.amount} credited to customer wallet successfully.`,
      newBalance: balanceAfter
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Superadmin confirm top-up error:', err.message);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

/**
 * POST /api/wallet-topups/superadmin/:id/reject
 * Super Admin rejects top-up request with a reason.
 */
router.post('/superadmin/:id/reject', ...superAdminOnly, async (req, res) => {
  const { rejectionReason } = req.body;
  if (!rejectionReason || !rejectionReason.trim()) {
    return res.status(400).json({ message: 'Rejection reason is required.' });
  }

  try {
    const request = await WalletTopUpRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Top-up request not found.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: `Cannot reject: request is already ${request.status}.` });
    }

    request.status = 'REJECTED';
    request.rejectionReason = rejectionReason.trim();
    request.verifiedBy = req.user.id;
    request.verifiedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: 'Payment request rejected by Super Admin. Customer wallet remains unchanged.'
    });
  } catch (err) {
    console.error('Superadmin reject top-up error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ─── RESTAURANT ADMIN (RESTRICTED) ───────────────────────────────────────────

const adminOnly = [auth, authorizeRoles('admin')];

router.get('/admin/requests', ...adminOnly, async (req, res) => {
  return res.status(403).json({
    message: 'Wallet top-ups are managed platform-wide exclusively by the Super Admin.'
  });
});

router.post('/admin/:id/confirm', ...adminOnly, async (req, res) => {
  return res.status(403).json({
    message: 'Wallet top-up approval is restricted to Super Admin.'
  });
});

router.post('/admin/:id/reject', ...adminOnly, async (req, res) => {
  return res.status(403).json({
    message: 'Wallet top-up rejection is restricted to Super Admin.'
  });
});

module.exports = router;
