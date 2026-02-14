"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Bell, BellOff, BellRing } from "lucide-react"
import {
  isNotificationSupported,
  requestNotificationPermission,
  getNotificationPermission,
  sendLocalNotification,
} from "@/lib/services/notifications.service"

export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default")
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [tipsEnabled, setTipsEnabled] = useState(true)
  const [achievementsEnabled, setAchievementsEnabled] = useState(true)

  useEffect(() => {
    setPermission(getNotificationPermission())
    // Cargar preferencias de localStorage
    const prefs = localStorage.getItem("notification-prefs")
    if (prefs) {
      const parsed = JSON.parse(prefs)
      setAlertsEnabled(parsed.alerts ?? true)
      setTipsEnabled(parsed.tips ?? true)
      setAchievementsEnabled(parsed.achievements ?? true)
    }
  }, [])

  const savePrefs = (alerts: boolean, tips: boolean, achievements: boolean) => {
    localStorage.setItem(
      "notification-prefs",
      JSON.stringify({ alerts, tips, achievements })
    )
  }

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === "granted") {
      sendLocalNotification({
        title: "¡Notificaciones activadas!",
        body: "Recibirás alertas sobre tus finanzas.",
      })
    }
  }

  const handleTestNotification = () => {
    sendLocalNotification({
      title: "Notificación de prueba",
      body: "Las notificaciones están funcionando correctamente.",
      tag: "test",
    })
  }

  if (!isNotificationSupported()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>Tu navegador no soporta notificaciones web.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones Web
            </CardTitle>
            <CardDescription>Configura las notificaciones que deseas recibir</CardDescription>
          </div>
          <Badge
            variant={permission === "granted" ? "default" : permission === "denied" ? "destructive" : "secondary"}
          >
            {permission === "granted" ? "Activadas" : permission === "denied" ? "Bloqueadas" : "Pendiente"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission !== "granted" && (
          <div className="rounded-lg border bg-muted/50 p-4 text-center space-y-3">
            <BellRing className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {permission === "denied"
                ? "Las notificaciones están bloqueadas. Habilítalas desde la configuración del navegador."
                : "Activa las notificaciones para recibir alertas sobre tus finanzas."}
            </p>
            {permission !== "denied" && (
              <Button onClick={handleRequestPermission} className="gap-2">
                <Bell className="h-4 w-4" />
                Activar Notificaciones
              </Button>
            )}
          </div>
        )}

        {permission === "granted" && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Alertas Financieras</p>
                  <p className="text-xs text-muted-foreground">Presupuestos, deudas y patrones</p>
                </div>
                <Switch
                  checked={alertsEnabled}
                  onCheckedChange={(v) => {
                    setAlertsEnabled(v)
                    savePrefs(v, tipsEnabled, achievementsEnabled)
                  }}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Consejos Diarios</p>
                  <p className="text-xs text-muted-foreground">Tips financieros personalizados</p>
                </div>
                <Switch
                  checked={tipsEnabled}
                  onCheckedChange={(v) => {
                    setTipsEnabled(v)
                    savePrefs(alertsEnabled, v, achievementsEnabled)
                  }}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Logros</p>
                  <p className="text-xs text-muted-foreground">Nuevos logros y rachas</p>
                </div>
                <Switch
                  checked={achievementsEnabled}
                  onCheckedChange={(v) => {
                    setAchievementsEnabled(v)
                    savePrefs(alertsEnabled, tipsEnabled, v)
                  }}
                />
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleTestNotification} className="w-full gap-2">
              <BellRing className="h-4 w-4" />
              Enviar Notificación de Prueba
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
