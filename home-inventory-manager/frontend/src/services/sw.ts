const PUBLIC_VAPID_KEY_STORAGE = 'vapid_public_key'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const bytes = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i)
  }
  return bytes
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.register('/sw.js')
  await registration.update()

  return registration
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function subscribeToPush(userId: number): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  try {
    const registration = await navigator.serviceWorker.ready

    let publicKey = localStorage.getItem(PUBLIC_VAPID_KEY_STORAGE)
    if (!publicKey) {
      const res = await (await fetch('/api/notifications/vapid-key')).json()
      if (!res.success) return false
      publicKey = res.data.public_key as string
      localStorage.setItem(PUBLIC_VAPID_KEY_STORAGE, publicKey)
    }

    if (!publicKey) return false

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, subscription }),
    })

    return true
  } catch (e) {
    console.error('Push subscription failed:', e)
    return false
  }
}

export async function unsubscribeFromPush(userId: number): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
    }

    await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })

    return true
  } catch (e) {
    console.error('Push unsubscription failed:', e)
    return false
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return !!subscription
  } catch {
    return false
  }
}
