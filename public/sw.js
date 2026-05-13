self.addEventListener('push', function(event) {
  if (!event.data) return

  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/icon-192.png',
      badge:   '/icon-192.png',
      vibrate: [200, 100, 200],
      data:    { url: data.url || '/ordenes' },
      actions: [
        { action: 'ver', title: 'Ver orden' },
      ],
    })
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  const url = event.notification.data?.url || '/ordenes'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
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