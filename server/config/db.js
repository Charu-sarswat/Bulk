const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Subscription = require('../models/Subscription');
const Setting = require('../models/Setting');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Bombat-Chowpati';

async function initDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Successfully connected to MongoDB database.');

    // Run SaaS Multi-Tenant Configuration Seeding
    await seedRequiredConfig();

    // Debug: Inspect database state
    try {
      const dbUsers = await User.find();
      const dbRestaurants = await Restaurant.find();
      const dbSubs = await Subscription.find();
      console.log('🔥 DB STATE - USERS:', dbUsers.map(u => ({ id: u._id, username: u.username, role: u.role, restaurantId: u.restaurantId })));
      console.log('🔥 DB STATE - RESTAURANTS:', dbRestaurants.map(r => ({ id: r._id, name: r.name, slug: r.slug, status: r.status, isActive: r.isActive })));
      console.log('🔥 DB STATE - SUBSCRIPTIONS:', dbSubs.map(s => ({ id: s._id, restaurantId: s.restaurantId, planId: s.planId, status: s.status, endDate: s.endDate })));
    } catch (dbErr) {
      console.error('Debug logging error:', dbErr.message);
    }

  } catch (err) {
    console.error('CRITICAL: Database initialization failed:', err);
    throw err; // Propagate the error so the server process doesn't hide database failures
  }
}

async function seedRequiredConfig() {
  console.log('--- STARTING SAAS REQUIRED CONFIGURATION SEEDING ---');

  // Drop legacy unique index on Settings if present
  try {
    const settingsCol = mongoose.connection.db.collection('settings');
    const indexes = await settingsCol.indexes();
    console.log('SETTINGS INDEXES:', indexes.map(i => i.name));
    if (indexes.some(idx => idx.name === 'key_1')) {
      await settingsCol.dropIndex('key_1');
      console.log('SUCCESSFULLY DROPPED legacy key_1 index.');
    }
  } catch (err) {
    console.error('Failed to drop Settings index:', err.message);
  }

  // Drop legacy restaurant-scoped customer index so global phone-only unique index can work
  try {
    const customersCol = mongoose.connection.db.collection('customers');
    const custIndexes = await customersCol.indexes();
    if (custIndexes.some(idx => idx.name === 'restaurantId_1_phone_1')) {
      await customersCol.dropIndex('restaurantId_1_phone_1');
      console.log('SUCCESSFULLY DROPPED legacy restaurantId_1_phone_1 customer index.');
    }
  } catch (err) {
    console.error('Failed to drop Customer compound index:', err.message);
  }

  // Drop legacy global unique index on orders if present
  try {
    const ordersCol = mongoose.connection.db.collection('orders');
    const orderIndexes = await ordersCol.indexes();
    if (orderIndexes.some(idx => idx.name === 'order_number_1')) {
      await ordersCol.dropIndex('order_number_1');
      console.log('SUCCESSFULLY DROPPED legacy order_number_1 index.');
    }
  } catch (err) {
    console.error('Failed to drop legacy order_number_1 index:', err.message);
  }

  // 1. Seed default platform subscription plans
  const plansData = [
    {
      name: 'Standard Student Plan',
      description: 'Prepaid food balance pass valid at all mess and restaurant outlets.',
      price: 3000,
      durationDays: 30,
      prepaidBalance: 3000,
      isActive: true
    },
    {
      name: 'Premium Food Pass',
      description: 'Full monthly meal balance pass with maximum savings across all outlets.',
      price: 5000,
      durationDays: 30,
      prepaidBalance: 5000,
      isActive: true
    },
    {
      name: 'Semester Meal Pass',
      description: 'Extended 90-day prepaid meal subscription across the platform.',
      price: 15000,
      durationDays: 90,
      prepaidBalance: 15000,
      isActive: true
    }
  ];

  const plans = [];
  for (const plan of plansData) {
    let existingPlan = await SubscriptionPlan.findOne({ name: plan.name });
    if (!existingPlan) {
      existingPlan = await SubscriptionPlan.create(plan);
      console.log(`Created platform subscription plan: ${plan.name}`);
    } else {
      existingPlan.price = plan.price;
      existingPlan.durationDays = plan.durationDays;
      existingPlan.prepaidBalance = plan.prepaidBalance;
      existingPlan.isActive = plan.isActive;
      await existingPlan.save();
    }
    plans.push(existingPlan);
  }

  // 2. Ensure default "Bombay Chowpati" Restaurant exists
  let bcRestaurant = await Restaurant.findOne({ slug: 'bombay-chowpati' });
  if (!bcRestaurant) {
    bcRestaurant = await Restaurant.create({
      name: 'Bombay Chowpati',
      slug: 'bombay-chowpati',
      ownerName: 'Ayush',
      email: 'ayush@bombaychowpati.com',
      phone: '9876543210',
      address: 'Chowpati Beach',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400007',
      status: 'active',
      isActive: true
    });
    console.log('Created default restaurant "Bombay Chowpati".');
  }

  // 3. Ensure "Bombay Chowpati" has an active platform subscription
  let bcSubscription = await Subscription.findOne({ restaurantId: bcRestaurant._id });
  if (!bcSubscription && plans.length > 0) {
    const defaultPlan = plans[0];
    const start = new Date();
    const end = new Date();
    end.setFullYear(end.getFullYear() + 10); // 10 years

    bcSubscription = await Subscription.create({
      restaurantId: bcRestaurant._id,
      planId: defaultPlan._id,
      status: 'active',
      startDate: start,
      endDate: end,
      billingCycle: 'yearly',
      amount: 99990,
      commissionPercentage: 0,
      autoRenew: true
    });
    console.log('Created default active subscription for Bombay Chowpati.');
  }

  // 4. Create default Super Admin if missing
  let superAdmin = await User.findOne({ role: 'super_admin' });
  if (!superAdmin) {
    const salt = await bcrypt.genSalt(10);
    const superAdminPass = await bcrypt.hash('superadmin123', salt);
    superAdmin = await User.create({
      username: 'superadmin',
      password_hash: superAdminPass,
      role: 'super_admin',
      restaurantId: null
    });
    console.log('Super Admin user created: superadmin (password: superadmin123)');
  }

  // 5. Ensure default settings exist for Bombay Chowpati if not present
  const defaultSettings = [
    { key: 'is_store_open', value: true },
    { key: 'delivery_fee', value: 45 },
    { key: 'free_delivery_threshold', value: 399 }
  ];

  for (const s of defaultSettings) {
    const exists = await Setting.findOne({ key: s.key, restaurantId: bcRestaurant._id });
    if (!exists) {
      await Setting.create({
        restaurantId: bcRestaurant._id,
        key: s.key,
        value: s.value
      });
    }
  }

  // 6. Associate legacy default users (admin, staff, kitchen) with Bombay Chowpati
  const legacyUsernames = ['admin', 'staff', 'kitchen'];
  for (const uname of legacyUsernames) {
    const uObj = await User.findOne({ username: uname });
    if (uObj && !uObj.restaurantId) {
      uObj.restaurantId = bcRestaurant._id;
      await uObj.save();
      console.log(`Associated legacy user "${uname}" with Bombay Chowpati restaurant.`);
    }
  }

  console.log('--- SAAS CONFIGURATION SEEDING COMPLETED SUCCESSFULY ---');
}

module.exports = { initDB };
