const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Restaurant = require('./models/Restaurant');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const Subscription = require('./models/Subscription');
const User = require('./models/User');

const run = async () => {
  try {
    console.log("URI:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully");
    const list = await Restaurant.find().sort({ createdAt: -1 });
    console.log("Restaurants found:", list.length);
    for (const r of list) {
      console.log("Restaurant:", r.name, r._id);
      const activeSub = await Subscription.findOne({ restaurantId: r._id, status: 'active' }).populate('planId');
      console.log("Active Sub:", activeSub ? "found" : "not found");
      if (activeSub) {
        console.log("Plan:", activeSub.planId);
      }
      const adminUser = await User.findOne({ restaurantId: r._id, role: 'admin' });
      console.log("Admin user:", adminUser ? adminUser.username : "not found");
    }
  } catch (err) {
    console.error("ERROR CAUSE:", err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
