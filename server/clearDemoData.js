require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Order = require('./models/Order');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Bombay-Chowpati';

async function clearData() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for clearing demo data...');

    const demoPhones = [
      '9876543210', '9876543211', '9876543212', '9876543213', '9876543214',
      '9876543215', '9876543216', '9876543217', '9876543218', '9876543219',
      '9876543220', '9876543221', '9876543222', '9876543223', '9876543224',
      '9876543225', '9876543226', '9876543227', '9876543228', '9876543229',
      '9876543230', '9876543231', '9876543232', '9876543233', '9876543234'
    ];

    // Delete demo orders
    const deletedOrders = await Order.deleteMany({ customer_phone: { $in: demoPhones } });
    console.log(`Deleted ${deletedOrders.deletedCount} demo orders.`);

    // Delete demo customers
    const deletedCustomers = await Customer.deleteMany({ phone: { $in: demoPhones } });
    console.log(`Deleted ${deletedCustomers.deletedCount} demo customer records.`);

    console.log('Demo data successfully cleared!');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing demo data:', err);
    process.exit(1);
  }
}

clearData();
