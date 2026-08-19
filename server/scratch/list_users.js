const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bombay-chowpati');
    console.log('Connected to MongoDB.');

    const User = require('../models/User');
    const Restaurant = require('../models/Restaurant');
    const Subscription = require('../models/Subscription');

    const users = await User.find();
    console.log('--- ALL USERS IN DB ---');
    console.log(users.map(u => ({ id: u._id, username: u.username, role: u.role, restaurantId: u.restaurantId })));

    const restaurants = await Restaurant.find();
    console.log('--- ALL RESTAURANTS IN DB ---');
    console.log(restaurants.map(r => ({ id: r._id, name: r.name, slug: r.slug, status: r.status, isActive: r.isActive })));

    const subs = await Subscription.find();
    console.log('--- ALL SUBSCRIPTIONS IN DB ---');
    console.log(subs.map(s => ({ id: s._id, restaurantId: s.restaurantId, planId: s.planId, status: s.status, endDate: s.endDate })));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

run();
