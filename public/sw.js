const CACHE_NAME = "digital-solutions-shell-v3";
const APP_SHELL = ["/", "/login", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then((response) => response || caches.match("/login"))));
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || "Digital Solutions", {
    body: data.body || "Tienes una actualización pendiente.",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    tag: data.tag || "digital-solutions-alert",
    data: { url: data.url || "/marketing" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/marketing", self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => "focus" in client);
    if (existing) {
      void existing.navigate(target);
      return existing.focus();
    }
    return clients.openWindow(target);
  }));
});
