const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Restaurant = require('./models/Restaurant');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const Subscription = require('./models/Subscription');
const User = require('./models/User');

const Category = require('./models/Category');
const MenuItem = require('./models/MenuItem');
const Order = require('./models/Order');
const Customer = require('./models/Customer');
const Table = require('./models/Table');
const RawMaterial = require('./models/RawMaterial');
const InventoryLog = require('./models/InventoryLog');
const CateringEnquiry = require('./models/CateringEnquiry');
const Setting = require('./models/Setting');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Bombat-Chowpati';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

async function migrate() {
  try {
    console.log('Connecting to database:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('Connected.');

    // 1. Create default plans
    console.log('Seeding default subscription plans...');
    const plansData = [
      {
        name: 'Basic',
        description: 'For small eateries starting out',
        monthlyPrice: 999,
        yearlyPrice: 9990,
        commissionPercentage: 5,
        features: ['Menu Management', 'Tables', 'QR Ordering', 'Basic Analytics'],
        maxTables: 20,
        maxStaff: 3,
        maxMenuItems: 100,
        inventoryEnabled: false,
        analyticsEnabled: false,
        cateringEnabled: false
      },
      {
        name: 'Growth',
        description: 'Perfect for growing casual dining restaurants',
        monthlyPrice: 1999,
        yearlyPrice: 19990,
        commissionPercentage: 3,
        features: ['Menu Management', 'Tables', 'QR Ordering', 'Staff Management', 'Inventory tracking', 'Catering Enquiries', 'Intermediate Analytics'],
        maxTables: 50,
        maxStaff: 10,
        maxMenuItems: 500,
        inventoryEnabled: true,
        analyticsEnabled: true,
        cateringEnabled: true
      },
      {
        name: 'Premium',
        description: 'For high volume, premium restaurants',
        monthlyPrice: 3999,
        yearlyPrice: 39990,
        commissionPercentage: 1,
        features: ['All Features', 'Unlimited Tables', 'Unlimited Staff', 'Unlimited Menu Items', 'Advanced Analytics'],
        maxTables: -1,
        maxStaff: -1,
        maxMenuItems: -1,
        inventoryEnabled: true,
        analyticsEnabled: true,
        cateringEnabled: true
      },
      {
        name: 'Enterprise',
        description: 'Custom solutions for restaurant chains',
        monthlyPrice: 9999,
        yearlyPrice: 99990,
        commissionPercentage: 0,
        features: ['Dedicated Support', 'Custom Integrations', 'Unlimited Resources'],
        maxTables: -1,
        maxStaff: -1,
        maxMenuItems: -1,
        inventoryEnabled: true,
        analyticsEnabled: true,
        cateringEnabled: true
      }
    ];

    const plans = [];
    for (const plan of plansData) {
      let existingPlan = await SubscriptionPlan.findOne({ name: plan.name });
      if (!existingPlan) {
        existingPlan = await SubscriptionPlan.create(plan);
        console.log(`Created subscription plan: ${plan.name}`);
      } else {
        // Update price/commission just in case
        existingPlan.monthlyPrice = plan.monthlyPrice;
        existingPlan.yearlyPrice = plan.yearlyPrice;
        existingPlan.commissionPercentage = plan.commissionPercentage;
        await existingPlan.save();
      }
      plans.push(existingPlan);
    }

    // 2. Create default restaurant "Bombay Chowpati"
    console.log('Ensuring default Bombay Chowpati restaurant exists...');
    let bcRestaurant = await Restaurant.findOne({ slug: 'bombay-chowpati' });
    if (!bcRestaurant) {
      bcRestaurant = await Restaurant.create({
        name: 'Bombay Chowpati',
        slug: 'bombay-chowpati',
        ownerName: 'Ayush',
        email: 'ayush@bombaychowpati.com',
        phone: '9876543210',
        address: 'Chowpati beach',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400007',
        status: 'active',
        isActive: true
      });
      console.log('Created Bombay Chowpati restaurant.');
    }

    // Ensure default restaurant has a subscription active
    let bcSubscription = await Subscription.findOne({ restaurantId: bcRestaurant._id });
    if (!bcSubscription) {
      const enterprisePlan = plans.find(p => p.name === 'Enterprise');
      const start = new Date();
      const end = new Date();
      end.setFullYear(end.getFullYear() + 10); // 10 year default enterprise subscription

      bcSubscription = await Subscription.create({
        restaurantId: bcRestaurant._id,
        planId: enterprisePlan._id,
        status: 'active',
        startDate: start,
        endDate: end,
        billingCycle: 'yearly',
        amount: 99990,
        commissionPercentage: 0,
        autoRenew: true
      });
      console.log('Created 10-year Enterprise subscription for Bombay Chowpati.');
    }

    // 3. Create default Super Admin if missing
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
      console.log('Super Admin user created: superadmin (superadmin123)');
    }

    // 4. Migrate existing data to Bombay Chowpati
    const tenantId = bcRestaurant._id;
    console.log(`Migrating all models to restaurant ID: ${tenantId}...`);

    const resultCategories = await Category.updateMany({ restaurantId: { $exists: false } }, { $set: { restaurantId: tenantId } });
    console.log(`Migrated ${resultCategories.modifiedCount} categories.`);

    const resultMenuItems = await MenuItem.updateMany({ restaurantId: { $exists: false } }, { $set: { restaurantId: tenantId } });
    console.log(`Migrated ${resultMenuItems.modifiedCount} menu items.`);

    const resultOrders = await Order.updateMany({ restaurantId: { $exists: false } }, { $set: { restaurantId: tenantId } });
    console.log(`Migrated ${resultOrders.modifiedCount} orders.`);

    const resultCustomers = await Customer.updateMany({ restaurantId: { $exists: false } }, { $set: { restaurantId: tenantId } });
    console.log(`Migrated ${resultCustomers.modifiedCount} customers.`);

    const resultTables = await Table.updateMany({ restaurantId: { $exists: false } }, { $set: { restaurantId: tenantId } });
    console.log(`Migrated ${resultTables.modifiedCount} tables.`);

    const resultRawMaterials = await RawMaterial.updateMany({ restaurantId: { $exists: false } }, { $set: { restaurantId: tenantId } });
    console.log(`Migrated ${resultRawMaterials.modifiedCount} raw materials.`);

    const resultInventoryLogs = await InventoryLog.updateMany({ restaurantId: { $exists: false } }, { $set: { restaurantId: tenantId } });
    console.log(`Migrated ${resultInventoryLogs.modifiedCount} inventory logs.`);

    const resultCateringEnquiries = await CateringEnquiry.updateMany({ restaurantId: { $exists: false } }, { $set: { restaurantId: tenantId } });
    console.log(`Migrated ${resultCateringEnquiries.modifiedCount} catering enquiries.`);

    const resultSettings = await Setting.updateMany({ restaurantId: { $exists: false } }, { $set: { restaurantId: tenantId } });
    console.log(`Migrated ${resultSettings.modifiedCount} settings.`);

    // Set existing admin, staff, kitchen users to default restaurant
    const resultUsers = await User.updateMany({ role: { $ne: 'super_admin' }, restaurantId: { $exists: false } }, { $set: { restaurantId: tenantId } });
    console.log(`Migrated ${resultUsers.modifiedCount} users to default restaurant.`);

    // Update existing tables QR codes if they don't have it set properly
    const tables = await Table.find({ restaurantId: tenantId });
    for (const t of tables) {
      const targetUrl = `${clientUrl}/table/${t._id}`;
      t.qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(targetUrl)}&margin=1`;
      await t.save();
    }
    console.log(`Updated QR codes for ${tables.length} tables.`);

    console.log('Migration finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
