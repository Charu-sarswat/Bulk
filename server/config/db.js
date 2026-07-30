const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const InventoryLog = require('../models/InventoryLog');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Bombat-Chowpati';

async function initDB() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('Successfully connected to MongoDB database: Bombat-Chowpati');

    // 1. Seed System Users (Admin, Staff, Kitchen) if missing
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('Seeding default system users...');
      const salt = await bcrypt.genSalt(10);
      const adminPass = await bcrypt.hash('admin123', salt);
      const staffPass = await bcrypt.hash('staff123', salt);
      const kitchenPass = await bcrypt.hash('kitchen123', salt);

      await User.create([
        { username: 'admin', password_hash: adminPass, role: 'admin' },
        { username: 'staff', password_hash: staffPass, role: 'staff' },
        { username: 'kitchen', password_hash: kitchenPass, role: 'kitchen' }
      ]);
      console.log('Default users seeded: admin (admin123), staff (staff123), kitchen (kitchen123)');
    }

    // 2. Menu seeding is handled by seedMenu.js — no auto-seed on startup.

    // 3. Seed Dining Tables if missing
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      console.log('Seeding default dining tables...');
      const defaultTables = [
        { table_number: '1', capacity: 2 },
        { table_number: '2', capacity: 4 },
        { table_number: '3', capacity: 4 },
        { table_number: '4', capacity: 6 },
        { table_number: '5', capacity: 4 },
        { table_number: 'VIP-1', capacity: 8 }
      ];
      await Table.insertMany(defaultTables);
    }

  } catch (err) {
    console.error('MongoDB init / connection error:', err.message);
  }
}

module.exports = { initDB };
