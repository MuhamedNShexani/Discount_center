/* eslint-disable no-restricted-globals */
// Service worker for Web Push notifications
self.addEventListener("push", function (event) {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: event.data.text() || "Notification" };
  }
  const title = data.title || "Notification";
  const options = {
    body: data.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: data,
    tag: "discount-app-" + Date.now(),
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const urlToOpen = "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.indexOf(self.registration.scope) !== -1 && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
