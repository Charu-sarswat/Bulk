const mongoose = require('mongoose');
const webpush = require('web-push');
require('dotenv').config(); // loads .env from the server root

const PushSubscription = require('../models/PushSubscription');

async function testPush() {
  const mongoUri = process.env.MONGODB_URI;
  const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
  const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

  console.log('MongoDB URI:', mongoUri ? 'Defined' : 'Missing');
  console.log('Public VAPID Key:', publicVapidKey ? 'Defined' : 'Missing');
  console.log('Private VAPID Key:', privateVapidKey ? 'Defined' : 'Missing');

  if (!mongoUri || !publicVapidKey || !privateVapidKey) {
    console.error('Missing configuration. Please check VAPID keys and MONGODB_URI in server/.env');
    process.exit(1);
  }

  // Set VAPID details
  webpush.setVapidDetails(
    'mailto:info@bombaychowpati.com',
    publicVapidKey,
    privateVapidKey
  );

  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const subscriptions = await PushSubscription.find();
    console.log(`Found ${subscriptions.length} registered push subscriptions.`);

    if (subscriptions.length === 0) {
      console.log('No registered push subscriptions to test. Please click "Enable Alerts" in the admin dashboard first.');
      mongoose.disconnect();
      return;
    }

    const payload = JSON.stringify({
      title: 'Test Order Alert! 🔔',
      body: 'Testing push notifications from Bombay Chowpati system server.',
      url: '/admin/live-orders',
      icon: '/logo.png',
      badge: '/logo.png'
    });

    for (const sub of subscriptions) {
      console.log(`Sending to subscription endpoint: ${sub.subscription.endpoint.slice(0, 45)}...`);
      try {
        await webpush.sendNotification(sub.subscription, payload);
        console.log('✅ Send successful!');
      } catch (err) {
        console.error(`❌ Send failed (Status: ${err.statusCode || 'unknown'}):`, err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log('Removing expired subscription...');
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    }

    console.log('Done testing.');
  } catch (error) {
    console.error('Testing script failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

testPush();
