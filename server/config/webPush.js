const webpush = require('web-push');

const initWebPush = () => {
  const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
  const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

  if (!publicVapidKey || !privateVapidKey) {
    console.warn('⚠️ Web Push VAPID keys are missing in environment variables. Push notifications will be disabled.');
    return;
  }

  webpush.setVapidDetails(
    'mailto:info@bombaychowpati.com',
    publicVapidKey,
    privateVapidKey
  );
  console.log('✅ Web Push initialized successfully.');
};

const sendPushNotification = async (subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('Expired/unsubscribed endpoint detected. Clean subscription.');
      // Return true to delete expired subscription in router
      return true;
    }
    console.error('Error sending push notification:', error.message);
  }
  return false;
};

module.exports = {
  initWebPush,
  sendPushNotification
};
