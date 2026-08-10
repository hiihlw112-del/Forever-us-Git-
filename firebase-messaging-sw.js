/**
 * Service worker for Forever Us push notifications.
 *
 * This file must live at the ROOT of your site (same folder as index.html,
 * uploaded to GitHub as-is - do not move it into a subfolder), or the
 * browser won't grant it the right scope to receive notifications.
 *
 * IMPORTANT: this file can't share code with index.html, so you need to
 * paste your Firebase config in TWO places - once here, once in
 * index.html. Copy the exact same firebaseConfig object you used there.
 */

importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://PASTE_YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Fires when a push arrives while the app is closed or not in focus.
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Forever Us';
  const body = (payload.notification && payload.notification.body) || 'You have a new update.';
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  });
});

// Tapping the notification focuses an already-open tab, or opens a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
