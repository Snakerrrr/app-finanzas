# 🧪 Plan de Pruebas - FinanzasCL

**Fecha:** 14 de Febrero, 2026  
**Alcance:** Roadmap Enterprise (FASE 1-2) + Plan de Mejoras Web (FASE 1-3) + Optimización de Rendimiento  
**Tipo:** Pruebas manuales funcionales, de integración y de rendimiento

---

## 📋 Instrucciones Generales

- **Prerrequisito:** Tener la app corriendo en `localhost:3000` con `npm run dev`
- **Usuario de prueba:** Iniciar sesión con una cuenta válida (Google OAuth o credenciales)
- **Navegador recomendado:** Chrome (DevTools para rendimiento y red)
- **Marcar con ✅ o ❌** cada caso al ejecutar
- **Anotar observaciones** en la columna correspondiente

---

## 🔴 SECCIÓN A: INFRAESTRUCTURA ENTERPRISE (Roadmap FASE 1-2)

### A.1 Rate Limiting

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| A1.1 | Rate limit funciona | 1. Abrir el chat IA. 2. Enviar 10+ mensajes rápidamente | Después de 10 mensajes en 1 minuto, recibir error 429 "Too Many Requests" | | |
| A1.2 | Headers de rate limit | 1. Abrir DevTools > Network. 2. Enviar mensaje al chat | Respuesta incluye headers `X-RateLimit-Limit`, `X-RateLimit-Remaining` | | |
| A1.3 | Recuperación del rate limit | 1. Alcanzar el límite. 2. Esperar 1 minuto. 3. Enviar mensaje | El mensaje se procesa correctamente | | |

### A.2 Caching (Upstash Redis)

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| A2.1 | Cache del dashboard | 1. Cargar dashboard. 2. Recargar inmediatamente (< 30s) | Segunda carga notablemente más rápida (cache hit) | | |
| A2.2 | Invalidación al crear | 1. Cargar dashboard. 2. Crear un movimiento. 3. Volver al dashboard | Dashboard muestra el nuevo movimiento (cache invalidado) | | |
| A2.3 | Invalidación al eliminar | 1. Cargar dashboard. 2. Eliminar un movimiento. 3. Volver al dashboard | Dashboard ya no muestra el movimiento eliminado | | |

### A.3 Logging Estructurado (Pino)

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| A3.1 | Logs del chat | 1. Enviar mensaje al chat IA. 2. Revisar terminal del servidor | Logs estructurados con `event: "chat:request"`, `userId`, `timestamp` | | |
| A3.2 | Logs de cache | 1. Cargar dashboard. 2. Revisar terminal | Logs con emojis: ✅ HIT, ⚠️ MISS, 💾 SET | | |

### A.4 Connection Pooling (PgBouncer)

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| A4.1 | Conexión estable | 1. Navegar por varias páginas rápidamente (dashboard, movimientos, presupuestos, metas, tarjetas) | Sin errores de conexión en consola ni terminal | | |
| A4.2 | Operaciones concurrentes | 1. Abrir 3 pestañas de la app. 2. Navegar en las 3 simultáneamente | Sin errores "Too many connections" | | |

### A.5 Persistencia del Chat (Zustand)

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| A5.1 | Persistencia al recargar | 1. Enviar 2-3 mensajes al chat. 2. Recargar la página (F5) | Mensajes siguen visibles después de recargar | | |
| A5.2 | Persistencia entre rutas | 1. Enviar mensajes al chat. 2. Navegar a /movimientos. 3. Volver al dashboard y abrir chat | Historial de chat intacto | | |
| A5.3 | Limpiar historial | 1. Enviar mensajes. 2. Click en botón 🗑️ del chat. 3. Confirmar eliminación | Historial se borra. Aparece diálogo de confirmación (no alert del navegador) | | |

### A.6 UX Móvil (Bottom Sheet)

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| A6.1 | Drawer en móvil | 1. Redimensionar ventana a < 768px. 2. Abrir chat | Chat aparece como bottom sheet (drawer desde abajo) | | |
| A6.2 | Ventana en desktop | 1. Ventana > 768px. 2. Abrir chat | Chat aparece como ventana flotante | | |
| A6.3 | Cerrar drawer | 1. Abrir chat en móvil. 2. Arrastrar hacia abajo | Drawer se cierra suavemente | | |

### A.7 Autenticación API Móvil (JWT)

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| A7.1 | Login móvil | Ejecutar en terminal: `curl -X POST http://localhost:3000/api/auth/mobile/login -H "Content-Type: application/json" -d '{"email":"TU_EMAIL","password":"TU_PASSWORD"}'` | Respuesta con `token` y `user` (o error si OAuth) | | |
| A7.2 | API con token | 1. Obtener token del paso anterior. 2. `curl http://localhost:3000/api/v1/movimientos -H "Authorization: Bearer TOKEN"` | Lista de movimientos en JSON | | |
| A7.3 | Token inválido | `curl http://localhost:3000/api/v1/movimientos -H "Authorization: Bearer token_falso"` | Error 401 Unauthorized | | |
| A7.4 | Sin autenticación | `curl http://localhost:3000/api/v1/movimientos` | Error 401 Unauthorized | | |

---

## 🔵 SECCIÓN B: MEJORAS WEB - FASE 1 (Fundaciones)

### B.1 Dashboard Modo Compacto/Expandido

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| B1.1 | Toggle compacto | 1. Ir al dashboard. 2. Click en toggle de modo compacto (esquina superior derecha) | Dashboard cambia a modo compacto: solo KPIs visibles, gráficos y movimientos ocultos | | |
| B1.2 | Toggle expandido | 1. Estar en modo compacto. 2. Click en toggle | Dashboard vuelve a modo expandido con todos los componentes | | |
| B1.3 | Persistencia del modo | 1. Activar modo compacto. 2. Recargar página | Se mantiene en modo compacto (localStorage) | | |

### B.2 Semáforo de Salud Financiera

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| B2.1 | Score visible | 1. Ir al dashboard (modo expandido) | Card de "Salud Financiera" visible con score 0-100, barra circular animada y color contextual | | |
| B2.2 | Recomendaciones | 1. Observar la card de salud financiera | Muestra recomendaciones personalizadas según el score | | |

### B.3 FAB (Floating Action Button)

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| B3.1 | FAB visible | 1. Ir a cualquier página del dashboard | Botón "+" flotante visible en esquina inferior derecha | | |
| B3.2 | Menú expandible | 1. Click en FAB | Se expande mostrando opciones: Ingreso, Gasto, Transferencia | | |
| B3.3 | Crear desde FAB | 1. Expandir FAB. 2. Click en "Gasto" | Navega a la página correspondiente o abre formulario | | |

### B.4 Proyección de Balance

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| B4.1 | Card visible | 1. Dashboard expandido | Card "Proyección de Balance" muestra balance actual, proyectado, ingresos y gastos pendientes | | |
| B4.2 | Días restantes | 1. Observar la card | Muestra correctamente los días restantes del mes | | |

### B.5 Comparación Mensual

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| B5.1 | Comparación visible | 1. Dashboard expandido | Card de comparación muestra Ingresos, Gastos y Balance del mes actual vs anterior | | |
| B5.2 | Porcentajes de cambio | 1. Observar la card | Muestra porcentaje de cambio (↑ verde para mejora, ↓ rojo para empeoramiento) | | |

---

## 🟡 SECCIÓN C: MEJORAS WEB - FASE 2 (Experiencia)

### C.1 Gastos Recurrentes

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| C1.1 | Acceso desde sidebar | 1. Click en "Gastos Recurrentes" en el sidebar | Navega a `/recurrentes` | | |
| C1.2 | Crear recurrente | 1. Click "Agregar". 2. Llenar formulario (nombre, monto, frecuencia, categoría, cuenta). 3. Guardar | Gasto recurrente aparece en la lista | | |
| C1.3 | Editar recurrente | 1. Click en botón editar de un gasto recurrente. 2. Modificar datos. 3. Guardar | Datos actualizados correctamente | | |
| C1.4 | Eliminar recurrente | 1. Click en botón eliminar. 2. Confirmar | Gasto recurrente desaparece de la lista | | |
| C1.5 | Toggle activo/inactivo | 1. Click en toggle de estado | Estado cambia entre activo e inactivo | | |
| C1.6 | Próxima fecha | 1. Observar un gasto recurrente | Muestra la próxima fecha de cobro calculada correctamente | | |

### C.2 Alertas Inteligentes

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| C2.1 | Alertas en dashboard | 1. Tener presupuestos con gastos > 80%. 2. Cargar dashboard | Alertas aparecen en la parte superior del dashboard (carga lazy) | | |
| C2.2 | Marcar como leída | 1. Click en "Marcar como leída" en una alerta | Alerta cambia de estilo (ya no resaltada) | | |
| C2.3 | Descartar alerta | 1. Click en "Descartar" en una alerta | Alerta desaparece de la lista | | |

### C.3 Formulario Rápido/Completo

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| C3.1 | Modo rápido por defecto | 1. Click en "Agregar Movimiento" (nuevo) | Formulario abre en modo "Rápido" con campos mínimos | | |
| C3.2 | Cambiar a completo | 1. Abrir formulario nuevo. 2. Click en toggle "Completo" | Se muestran todos los campos (notas, cuotas, subcategoría, etc.) | | |
| C3.3 | Edición siempre completa | 1. Click en editar un movimiento existente | Formulario abre en modo completo con todos los campos | | |

### C.4 Gráficos Interactivos (Click to Filter)

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| C4.1 | Click en categoría | 1. Dashboard expandido. 2. Click en un sector del gráfico "Gastos por Categoría" | Sector seleccionado se resalta, otros se atenúan. Badge con nombre de categoría aparece | | |
| C4.2 | Deseleccionar | 1. Click en el badge "✕" o click en el mismo sector | Filtro se quita, todos los sectores vuelven a opacidad normal | | |
| C4.3 | Click en tipo de gasto | 1. Click en sector del gráfico "Distribución por Tipo" | Mismo comportamiento de filtro interactivo | | |

### C.5 Búsqueda y Filtros Mejorados (Movimientos)

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| C5.1 | Búsqueda por texto | 1. Ir a /movimientos. 2. Escribir en el campo de búsqueda | Filtra movimientos por descripción, categoría o notas | | |
| C5.2 | Filtro por tipo | 1. Click en "Filtros". 2. Seleccionar tipo "Ingreso" | Solo muestra ingresos | | |
| C5.3 | Filtro por categoría | 1. Seleccionar una categoría en filtros | Solo muestra movimientos de esa categoría | | |
| C5.4 | Filtro por rango de fechas | 1. Seleccionar fecha "Desde" y "Hasta" | Solo muestra movimientos dentro del rango | | |
| C5.5 | Limpiar filtros | 1. Aplicar varios filtros. 2. Click en "Limpiar filtros" | Todos los filtros se resetean, se muestran todos los movimientos | | |
| C5.6 | Indicador de filtros activos | 1. Aplicar un filtro | Botón "Filtros" muestra badge "!" indicando filtros activos | | |

### C.6 Exportación CSV/PDF

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| C6.1 | Exportar CSV | 1. Ir a /movimientos. 2. Click en botón de exportación > CSV | Se descarga archivo .csv con los movimientos filtrados | | |
| C6.2 | Exportar PDF | 1. Click en botón de exportación > PDF | Se descarga archivo .pdf con tabla formateada | | |
| C6.3 | Exportar con filtros | 1. Aplicar filtros. 2. Exportar CSV | El archivo solo contiene los movimientos filtrados | | |

### C.7 Vista Semanal de Gastos

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| C7.1 | Card visible | 1. Dashboard expandido | Card "Gastos Semanales" muestra gráfico de barras con gastos por semana del mes | | |

### C.8 Heatmap de Gastos

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| C8.1 | Heatmap visible | 1. Dashboard expandido | Heatmap tipo calendario muestra intensidad de gasto por día del mes | | |
| C8.2 | Colores correctos | 1. Observar el heatmap | Días sin gasto = gris claro, gastos altos = rojo intenso | | |

---

## 🟢 SECCIÓN D: MEJORAS WEB - FASE 3 (Engagement)

### D.1 Sistema de Gamificación

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| D1.1 | Card de gamificación | 1. Dashboard expandido. 2. Esperar carga lazy (~2s) | Card "Tu Progreso" visible con racha actual, mejor racha, nivel y logros | | |
| D1.2 | Racha de días | 1. Observar la card | Muestra número de días de racha con icono 🔥 animado | | |
| D1.3 | Nivel del usuario | 1. Observar badge de nivel | Muestra nivel actual (Bronce/Plata/Oro/Platino) con color correspondiente | | |
| D1.4 | Logros desbloqueados | 1. Tener al menos 1 movimiento registrado | Logro "Primera Transacción" 🎯 aparece en la lista de logros | | |

### D.2 Consejos Financieros (Tip del Día)

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| D2.1 | Tip visible | 1. Dashboard expandido. 2. Esperar carga lazy | Card de tip del día visible con título, contenido y categoría | | |
| D2.2 | Categoría coloreada | 1. Observar la card | Borde izquierdo coloreado según categoría (azul=Presupuesto, verde=Ahorro, etc.) | | |
| D2.3 | Tip consistente | 1. Recargar la página varias veces | El mismo tip se muestra durante todo el día | | |

### D.3 Tendencias Anuales

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| D3.1 | Gráfico de tendencias | 1. Dashboard expandido | Card "Tendencias (6 meses)" con gráfico de área (ingresos vs gastos) | | |
| D3.2 | Promedios | 1. Observar resumen bajo el gráfico | Muestra promedio de ingresos, promedio de gastos y tendencia % | | |
| D3.3 | Indicador de tendencia | 1. Observar el indicador | Flecha verde ↓ si gastos bajan, flecha roja ↑ si gastos suben | | |

### D.4 Onboarding Interactivo

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| D4.1 | Se muestra para nuevos usuarios | 1. Borrar `onboarding-completed` de localStorage (DevTools > Application > Local Storage). 2. Recargar | Wizard de onboarding aparece como modal con 5 pasos | | |
| D4.2 | Navegación entre pasos | 1. Click "Siguiente" varias veces | Avanza por los 5 pasos con animaciones. Indicador de progreso se actualiza | | |
| D4.3 | Botón "Anterior" | 1. Avanzar al paso 3. 2. Click "Anterior" | Retrocede al paso 2 | | |
| D4.4 | Saltar tutorial | 1. Click "Saltar tutorial" | Onboarding se cierra y no vuelve a aparecer | | |
| D4.5 | Completar tutorial | 1. Llegar al último paso. 2. Click "Comenzar" | Onboarding se cierra y no vuelve a aparecer al recargar | | |
| D4.6 | No se muestra de nuevo | 1. Completar o saltar el onboarding. 2. Recargar la página | Onboarding NO aparece | | |

### D.5 Empty States

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| D5.1 | Movimientos vacíos | 1. Ir a /movimientos con filtros que no tengan resultados | Empty state con icono, mensaje descriptivo y botón "Limpiar filtros" | | |
| D5.2 | Grupos familiares vacíos | 1. Ir a /familia sin tener grupos | Empty state con mensaje y botón "Crear Grupo" | | |
| D5.3 | Animación | 1. Observar cualquier empty state | Icono aparece con animación de escala (spring) | | |

### D.6 Edición Inline de Transacciones

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| D6.1 | Activar con botón | 1. Ir a /movimientos. 2. Click en icono de lápiz ✏️ de una fila | Fila se convierte en campos editables (fecha, descripción, categoría, monto) | | |
| D6.2 | Activar con doble-click | 1. Doble-click en cualquier fila de la tabla | Fila entra en modo edición | | |
| D6.3 | Guardar con Enter | 1. Modificar un campo. 2. Presionar Enter | Cambios se guardan. Toast de confirmación aparece. Fila vuelve a modo lectura | | |
| D6.4 | Cancelar con Escape | 1. Entrar en modo edición. 2. Presionar Escape | Cambios se descartan. Fila vuelve a modo lectura con datos originales | | |
| D6.5 | Cancelar con botón | 1. Entrar en modo edición. 2. Click en botón ✕ | Cambios se descartan | | |

### D.7 Importación CSV

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| D7.1 | Botón visible | 1. Ir a /movimientos | Botón "Importar CSV" visible junto a los botones de exportación | | |
| D7.2 | Subir archivo | 1. Click "Importar CSV". 2. Seleccionar un archivo .csv | Modal muestra preview de las filas detectadas | | |
| D7.3 | Preview correcto | 1. Subir CSV con datos | Tabla preview muestra fecha, descripción, monto y tipo correctamente | | |
| D7.4 | Seleccionar cuenta | 1. En el paso de preview, seleccionar una cuenta destino | Dropdown muestra las cuentas del usuario | | |
| D7.5 | Importar exitosamente | 1. Seleccionar cuenta y categoría. 2. Click "Importar X movimientos" | Barra de progreso avanza. Al finalizar, muestra resumen (exitosos/fallidos) | | |
| D7.6 | CSV con errores | 1. Subir CSV con filas mal formateadas | Muestra errores detectados y solo importa las filas válidas | | |
| D7.7 | Formato punto y coma | 1. Subir CSV con separador `;` | Parser detecta automáticamente el separador | | |

**Archivo CSV de prueba** (guardar como `test-import.csv`):
```
fecha;descripcion;monto;tipo
15/01/2026;Supermercado Lider;-25000;Gasto
01/01/2026;Sueldo Enero;1500000;Ingreso
20/01/2026;Netflix;-8990;Gasto
05/01/2026;Uber;-5600;Gasto
```

### D.8 Grupos Familiares

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| D8.1 | Acceso desde sidebar | 1. Click en "Grupo Familiar" en sidebar | Navega a `/familia` | | |
| D8.2 | Crear grupo | 1. Click "Crear Grupo". 2. Ingresar nombre. 3. Click "Crear" | Grupo aparece con nombre, código de invitación y el usuario como propietario (👑) | | |
| D8.3 | Copiar código | 1. Click en icono de copiar junto al código | Código se copia al portapapeles. Toast de confirmación | | |
| D8.4 | Unirse a grupo | 1. Click "Unirse". 2. Ingresar código de 6 caracteres. 3. Click "Unirse" | Usuario se agrega al grupo como miembro | | |
| D8.5 | Código inválido | 1. Click "Unirse". 2. Ingresar código falso | Mensaje de error: "Código de invitación inválido" | | |
| D8.6 | Eliminar grupo (propietario) | 1. Click "Eliminar" en un grupo propio. 2. Confirmar | Grupo se elimina | | |
| D8.7 | Salir de grupo (miembro) | 1. Click "Salir" en un grupo donde no eres propietario | Usuario sale del grupo | | |

### D.9 Notificaciones Web

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| D9.1 | Card en configuración | 1. Ir a /configuracion | Card "Notificaciones Web" visible con estado del permiso | | |
| D9.2 | Solicitar permiso | 1. Click "Activar Notificaciones" | Navegador muestra diálogo de permiso. Al aceptar, se recibe notificación de confirmación | | |
| D9.3 | Configuración granular | 1. Activar notificaciones. 2. Toggle de "Alertas Financieras" | Switch cambia estado. Preferencia se guarda | | |
| D9.4 | Notificación de prueba | 1. Con permisos activados, click "Enviar Notificación de Prueba" | Notificación del sistema operativo aparece | | |
| D9.5 | Persistencia de preferencias | 1. Desactivar "Consejos Diarios". 2. Recargar página | Toggle sigue desactivado | | |

---

## ⚡ SECCIÓN E: RENDIMIENTO

### E.1 Tiempo de Carga del Dashboard

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| E1.1 | Carga inicial | 1. Abrir DevTools > Network. 2. Navegar al dashboard | Página interactiva en < 5 segundos | | |
| E1.2 | Carga con cache | 1. Recargar dashboard (< 30s después) | Carga en < 3 segundos | | |
| E1.3 | Skeleton visible | 1. Recargar dashboard | Skeletons de carga aparecen inmediatamente mientras se cargan datos | | |
| E1.4 | Datos lazy visibles | 1. Cargar dashboard. 2. Observar gamificación, tip y alertas | Aparecen ~1-2 segundos después del render principal (carga lazy) | | |

### E.2 Navegación General

| # | Caso de Prueba | Pasos | Resultado Esperado | ✅/❌ | Observaciones |
|---|---------------|-------|-------------------|------|---------------|
| E2.1 | Navegación fluida | 1. Navegar entre: Dashboard → Movimientos → Recurrentes → Familia → Configuración | Transiciones sin lag perceptible (< 2s cada una) | | |
| E2.2 | Sin errores en consola | 1. Abrir DevTools > Console. 2. Navegar por toda la app | Sin errores rojos en consola (warnings son aceptables) | | |

---

## 🔄 SECCIÓN F: FLUJOS COMPLETOS (E2E)

### F.1 Flujo de Nuevo Usuario

| # | Paso | Acción | Resultado Esperado | ✅/❌ |
|---|------|--------|-------------------|------|
| F1.1 | Registro | Registrarse/iniciar sesión | Acceso al dashboard | |
| F1.2 | Onboarding | Completar o saltar el wizard | Onboarding se cierra | |
| F1.3 | Crear cuenta | Ir a Categorías & Cuentas > crear cuenta bancaria | Cuenta creada | |
| F1.4 | Primer movimiento | Usar FAB > Gasto > llenar formulario rápido | Movimiento creado | |
| F1.5 | Dashboard actualizado | Volver al dashboard | KPIs, gráficos y datos reflejan el movimiento | |
| F1.6 | Logro desbloqueado | Observar card de gamificación | Logro "Primera Transacción" 🎯 visible | |

### F.2 Flujo de Gestión Mensual

| # | Paso | Acción | Resultado Esperado | ✅/❌ |
|---|------|--------|-------------------|------|
| F2.1 | Revisar dashboard | Cargar dashboard | KPIs, salud financiera, proyección y comparación mensual visibles | |
| F2.2 | Registrar gastos | Crear 3-5 movimientos de gasto | Movimientos aparecen en lista | |
| F2.3 | Revisar presupuestos | Ir a /presupuestos | Presupuestos muestran progreso actualizado | |
| F2.4 | Exportar reporte | Ir a /movimientos > Exportar CSV | Archivo descargado con datos correctos | |
| F2.5 | Consultar IA | Preguntar al chat "¿Cuáles son mis gastos del mes?" | Respuesta coherente con datos reales | |

### F.3 Flujo de Importación

| # | Paso | Acción | Resultado Esperado | ✅/❌ |
|---|------|--------|-------------------|------|
| F3.1 | Preparar CSV | Crear archivo CSV con 5+ movimientos | Archivo listo | |
| F3.2 | Importar | Ir a /movimientos > Importar CSV > subir archivo | Preview muestra filas | |
| F3.3 | Configurar | Seleccionar cuenta y categoría | Opciones seleccionadas | |
| F3.4 | Ejecutar | Click "Importar" | Barra de progreso > resumen exitoso | |
| F3.5 | Verificar | Cerrar modal > revisar lista de movimientos | Movimientos importados visibles en la tabla | |

---

## 📊 Resumen de Cobertura

| Sección | Casos | Área |
|---------|-------|------|
| A. Infraestructura Enterprise | 16 | Rate Limiting, Cache, Logging, Pooling, Chat, Móvil, JWT |
| B. Mejoras Web FASE 1 | 9 | Dashboard compacto, Salud financiera, FAB, Proyección, Comparación |
| C. Mejoras Web FASE 2 | 22 | Recurrentes, Alertas, Formulario, Gráficos, Filtros, Export, Semanal, Heatmap |
| D. Mejoras Web FASE 3 | 30 | Gamificación, Tips, Tendencias, Onboarding, Empty States, Inline Edit, CSV Import, Familia, Notificaciones |
| E. Rendimiento | 6 | Tiempos de carga, navegación |
| F. Flujos E2E | 14 | Nuevo usuario, Gestión mensual, Importación |
| **TOTAL** | **97** | |

---

## 📝 Registro de Ejecución

| Fecha | Ejecutor | Casos Pasados | Casos Fallidos | Observaciones |
|-------|----------|---------------|----------------|---------------|
| | | /97 | /97 | |

---

*Plan de pruebas creado: 14 Feb 2026*
