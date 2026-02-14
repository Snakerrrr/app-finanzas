/**
 * Servicio de Notificaciones Web
 * Gestiona permisos y envío de notificaciones del navegador
 */

export type NotificationPayload = {
  title: string
  body: string
  icon?: string
  tag?: string
  data?: Record<string, string>
}

/**
 * Verifica si las notificaciones están soportadas
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

/**
 * Solicita permiso de notificaciones
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied"
  return Notification.requestPermission()
}

/**
 * Obtiene el estado actual del permiso
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported"
  return Notification.permission
}

/**
 * Envía una notificación local del navegador
 */
export function sendLocalNotification(payload: NotificationPayload): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") return

  new Notification(payload.title, {
    body: payload.body,
    icon: payload.icon ?? "/icon-192.png",
    tag: payload.tag,
    data: payload.data,
  })
}

/**
 * Programar verificación periódica de alertas (cada 30 min)
 */
export function scheduleAlertCheck(callback: () => void): NodeJS.Timeout {
  return setInterval(callback, 30 * 60 * 1000) // 30 minutos
}
