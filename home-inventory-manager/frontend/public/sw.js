self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const { title, body, url, icon, badge } = data

  const options = {
    body,
    icon: icon || '/icon-192.png',
    badge: badge || '/icon-192.png',
    data: { url: url || '/' },
    vibrate: [200, 100, 200],
    tag: 'expiry-reminder',
    requireInteraction: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
