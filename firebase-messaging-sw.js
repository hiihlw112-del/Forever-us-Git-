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
  apiKey: "AIzaSyDjQbnOLYkQ_V3ymSCpn6_KK2kx3jT3cX4",
  authDomain: "forever-us-f.firebaseapp.com",
  databaseURL: "https://forever-us-f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "forever-us-f",
  storageBucket: "forever-us-f.firebasestorage.app",
  messagingSenderId: "402655189244",
  appId: "1:402655189244:web:55f595ef395a663c39df79",
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
