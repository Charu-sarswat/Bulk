const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const customerAuthMiddleware = require('../middleware/customerAuth');

const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const CustomerSubscription = require('../models/CustomerSubscription');
const SubscriptionUsage = require('../models/SubscriptionUsage');
const Restaurant = require('../models/Restaurant');
const Setting = require('../models/Setting');
const Order = require('../models/Order');

// Helper to ensure customer wallet exists
async function getOrCreateWallet(customerId, session = null) {
  const query = Wallet.findOne({ customerId });
  if (session) query.session(session);
  let wallet = await query;
  if (!wallet) {
    wallet = new Wallet({
      customerId,
      balance: 0,
      currency: 'INR',
      isActive: true
    });
    if (session) {
      await wallet.save({ session });
    } else {
      await wallet.save();
    }
  }
  return wallet;
}

// @route   GET /api/student/wallet
// @desc    Get customer wallet details and transaction history (reconciles with ledger)
router.get('/wallet', customerAuthMiddleware, async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.customer.id);
    const transactions = await WalletTransaction.find({ customerId: req.customer.id }).sort({ createdAt: -1 });

    // Auto-reconcile balance with transaction ledger if any discrepancy exists
    if (transactions.length > 0) {
      const ledgerSum = transactions.reduce((acc, t) => {
        if (t.status === 'SUCCESS') {
          return t.type === 'CREDIT' ? acc + t.amount : acc - t.amount;
        }
        return acc;
      }, 0);
      const cleanLedgerSum = Math.max(0, Math.round(ledgerSum * 100) / 100);
      if (wallet.balance !== cleanLedgerSum) {
        wallet.balance = cleanLedgerSum;
        await wallet.save();
      }
    }

    res.json({
      balance: wallet.balance,
      currency: wallet.currency,
      isActive: wallet.isActive,
      transactions
    });
  } catch (err) {
    console.error('Get wallet error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/student/wallet/topup
// @desc    Top-up customer wallet (mock gateway verification, directly credits in dev mode)
router.post('/wallet/topup', customerAuthMiddleware, async (req, res) => {
  const { amount } = req.body;
  const topupAmount = parseFloat(amount);
  if (isNaN(topupAmount) || topupAmount <= 0) {
    return res.status(400).json({ message: 'Invalid top-up amount' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await getOrCreateWallet(req.customer.id, session);
    const balanceBefore = wallet.balance;
    const balanceAfter = Math.round((balanceBefore + topupAmount) * 100) / 100;

    const updatedWallet = await Wallet.findOneAndUpdate(
      { customerId: req.customer.id },
      { $set: { balance: balanceAfter } },
      { new: true, session }
    );

    const transaction = new WalletTransaction({
      walletId: updatedWallet._id,
      customerId: req.customer.id,
      type: 'CREDIT',
      amount: topupAmount,
      balanceBefore,
      balanceAfter: updatedWallet.balance,
      referenceType: 'WALLET_TOPUP',
      description: `Wallet top-up of ₹${topupAmount.toFixed(2)}`,
      status: 'SUCCESS'
    });
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      balance: updatedWallet.balance,
      transaction
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Wallet topup error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/student/plans
// @desc    List all active Platform Subscription Plans (Created ONLY by Super Admin)
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
    res.json(plans);
  } catch (err) {
    console.error('Get platform plans error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/student/platform-upi
// @desc    Get Super Admin Platform UPI details for manual subscription purchase
router.get('/platform-upi', async (req, res) => {
  try {
    const upiIdSetting = await Setting.findOne({ key: 'platform_upi_id' });
    const upiNameSetting = await Setting.findOne({ key: 'platform_upi_name' });
    const upiQrSetting = await Setting.findOne({ key: 'platform_upi_qr' });

    res.json({
      upiId: upiIdSetting?.value || 'superadmin@upi',
      payeeName: upiNameSetting?.value || 'Bombay Chowpati Platform Admin',
      qrImage: upiQrSetting?.value || ''
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/student/subscriptions/purchase
// @desc    Purchase a Platform-wide Subscription (Payment goes to Super Admin)
router.post('/subscriptions/purchase', customerAuthMiddleware, async (req, res) => {
  const { planId, paymentMethod = 'WALLET', paymentReference, paymentProofImage } = req.body;
  if (!planId) {
    return res.status(400).json({ message: 'Plan ID is required' });
  }

  try {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: 'Active platform subscription plan not found.' });
    }

    const duration = plan.durationDays || 30;
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + duration);

    const prepaidVal = plan.prepaidBalance !== undefined ? plan.prepaidBalance : plan.price;

    // ─── STRICT RULE: ONLY ONE ACTIVE SUBSCRIPTION AT A TIME ──────────────────
    // A customer can purchase a new subscription ONLY when their current one reaches ₹0 OR expires.
    const existingActive = await CustomerSubscription.findOne({
      customerId: req.customer.id,
      status: 'ACTIVE',
      endDate: { $gte: new Date() },
      remainingBalance: { $gt: 0 }
    });

    if (existingActive) {
      const rem = existingActive.remainingBalance !== undefined ? existingActive.remainingBalance : (existingActive.initialBalance || 0);
      return res.status(400).json({
        message: `You already have an active subscription with ₹${rem.toFixed(0)} remaining balance (valid until ${new Date(existingActive.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}). You can only purchase a new subscription when your remaining balance reaches ₹0 or after your current subscription expires.`
      });
    }

    // Check if customer already has a pending verification request with Super Admin
    const pendingSub = await CustomerSubscription.findOne({
      customerId: req.customer.id,
      status: 'PENDING'
    });

    if (pendingSub) {
      return res.status(400).json({
        message: 'You already have a subscription payment verification request pending review with Super Admin.'
      });
    }

    const isWalletPayment = paymentMethod && (paymentMethod.toLowerCase() === 'wallet');

    // ─── OPTION A: PURCHASE VIA GLOBAL WALLET (Instant Activation) ─────────────
    if (isWalletPayment) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const wallet = await getOrCreateWallet(req.customer.id, session);
        if (wallet.balance < plan.price) {
          await session.abortTransaction();
          return res.status(400).json({
            message: `Insufficient wallet balance. Plan costs ₹${plan.price}, but your wallet balance is ₹${wallet.balance}.`
          });
        }

        const balanceBefore = wallet.balance;
        const updatedWallet = await Wallet.findOneAndUpdate(
          { customerId: req.customer.id, balance: { $gte: plan.price } },
          { $inc: { balance: -plan.price } },
          { new: true, session }
        );

        const walletTx = new WalletTransaction({
          walletId: updatedWallet._id,
          customerId: req.customer.id,
          type: 'DEBIT',
          amount: plan.price,
          balanceBefore,
          balanceAfter: updatedWallet.balance,
          referenceType: 'MESS_SUBSCRIPTION',
          description: `Platform Subscription: ${plan.name}`,
          status: 'SUCCESS'
        });
        await walletTx.save({ session });

        const subscription = new CustomerSubscription({
          customerId: req.customer.id,
          planId: plan._id,
          initialBalance: prepaidVal,
          remainingBalance: prepaidVal,
          startDate: start,
          endDate: end,
          status: 'ACTIVE',
          paymentReference: `WALLET_${walletTx._id}`
        });
        await subscription.save({ session });

        walletTx.referenceId = subscription._id;
        await walletTx.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
          success: true,
          message: 'Platform subscription activated successfully!',
          subscription: {
            ...subscription.toObject(),
            planId: plan,
            usedAmount: 0
          }
        });
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
      }
    }

    // ─── OPTION B: MANUAL SUPER ADMIN UPI PAYMENT (Pending Super Admin Verification) ──
    if (!paymentReference || !paymentReference.trim()) {
      return res.status(400).json({ message: 'UPI Transaction Ref / UTR number is required for manual payment verification.' });
    }

    const subscription = new CustomerSubscription({
      customerId: req.customer.id,
      planId: plan._id,
      initialBalance: prepaidVal,
      remainingBalance: prepaidVal,
      startDate: start,
      endDate: end,
      status: 'PENDING',
      paymentReference: paymentReference.trim(),
      paymentProofImage: paymentProofImage || ''
    });

    await subscription.save();

    res.status(201).json({
      success: true,
      pending: true,
      message: 'Subscription payment request submitted! Super Admin will verify your UTR and activate your subscription.',
      subscription
    });
  } catch (err) {
    console.error('Subscription purchase error:', err.message);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// @route   GET /api/student/subscriptions/active
// @desc    Get customer's active Platform Subscription with auto-reconciled remaining balance
router.get('/subscriptions/active', customerAuthMiddleware, async (req, res) => {
  try {
    const sub = await CustomerSubscription.findOne({
      customerId: req.customer.id,
      status: 'ACTIVE'
    }).populate('planId', 'name description price durationDays prepaidBalance');

    if (!sub) {
      return res.json([]);
    }

    const now = new Date();
    if (now > new Date(sub.endDate)) {
      sub.status = 'EXPIRED';
      await sub.save();
      return res.json([]);
    }

    const initBal = sub.initialBalance !== undefined ? sub.initialBalance : (sub.planId?.prepaidBalance || sub.planId?.price || 5000);
    if (sub.initialBalance === undefined) {
      sub.initialBalance = initBal;
    }

    // Auto-reconcile all SubscriptionUsage debits
    const usages = await SubscriptionUsage.find({
      subscriptionId: sub._id,
      type: 'DEBIT'
    });

    const totalUsed = usages.reduce((acc, u) => acc + (u.amount || 0), 0);
    const cleanRemaining = Math.max(0, Math.round((initBal - totalUsed) * 100) / 100);

    if (sub.remainingBalance !== cleanRemaining) {
      sub.remainingBalance = cleanRemaining;
      await sub.save();
    }

    const subObj = sub.toObject();
    subObj.initialBalance = initBal;
    subObj.remainingBalance = cleanRemaining;
    subObj.subscriptionBalance = cleanRemaining; // alias for backwards compatibility
    subObj.usedAmount = Math.round(totalUsed * 100) / 100;

    res.json([subObj]);
  } catch (err) {
    console.error('Get active subscription error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/student/subscriptions/usages
// @desc    Get Platform Subscription food order usage history across all restaurants
router.get('/subscriptions/usages', customerAuthMiddleware, async (req, res) => {
  try {
    const usages = await SubscriptionUsage.find({
      customerId: req.customer.id
    })
      .populate('restaurantId', 'name slug logo')
      .populate('orderId', 'order_number total_amount')
      .sort({ createdAt: -1 });

    res.json(usages);
  } catch (err) {
    console.error('Get subscription usages error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/student/subscriptions/my-requests
// @desc    Get list of all subscription purchase requests submitted by customer
router.get('/subscriptions/my-requests', customerAuthMiddleware, async (req, res) => {
  try {
    const list = await CustomerSubscription.find({
      customerId: req.customer.id
    })
      .populate('planId', 'name description price durationDays prepaidBalance')
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
