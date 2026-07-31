// service worker for handling background push alerts (even when browser is closed)
self.addEventListener('push', (event) => {
  let data = {
    title: 'New Order Placed! 🍽️',
    body: 'You have a new order ticket to prepare.',
    url: '/admin/live-orders',
    icon: '/logo.png',
    badge: '/logo.png'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    data: {
      url: data.url || '/admin/live-orders'
    },
    vibrate: [200, 100, 200, 100, 200, 100, 400],
    requireInteraction: true, // keeps the notification visible until user clicks/dismisses it
    actions: [
      { action: 'open', title: 'Open Kitchen Queue' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickUrl = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(clickUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Or open a new window
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});
