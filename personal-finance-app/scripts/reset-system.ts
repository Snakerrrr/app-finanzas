// Script para limpiar todos los usuarios y datos del sistema
// Este script limpia el localStorage completamente

function resetSystem() {
  console.log("[v0] Iniciando limpieza del sistema...")

  // Limpiar usuario actual
  localStorage.removeItem("finanzas-cl-user")
  console.log("[v0] Usuario actual eliminado")

  // Limpiar todos los usuarios registrados
  localStorage.removeItem("finanzas-cl-users")
  console.log("[v0] Base de datos de usuarios eliminada")

  // Limpiar todos los datos de usuarios
  const keys = Object.keys(localStorage)
  keys.forEach((key) => {
    if (key.startsWith("finanzas-cl-data-")) {
      localStorage.removeItem(key)
      console.log(`[v0] Datos eliminados: ${key}`)
    }
  })

  console.log("[v0] Sistema limpiado completamente. Recarga la página para comenzar desde cero.")

  // Recargar la página automáticamente
  window.location.reload()
}

// Ejecutar la limpieza
resetSystem()

export {}
