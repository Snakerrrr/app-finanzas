# 📋 Plan de Implementación: Mejoras Web

**Fecha de creación:** 14 de Febrero, 2026  
**Origen:** Validación de mejoras implementadas en app móvil iOS  
**Objetivo:** Replicar mejoras exitosas en versión web (Next.js/React)

---

## 📊 Resumen Ejecutivo

**Total de mejoras a implementar:** 23 features  
**Tiempo estimado total:** ~65 horas (2.5 semanas full-time)  
**Migraciones de BD requeridas:** 5 nuevos modelos + extensiones

---

## 🎯 Estrategia de Implementación

### Criterios de Priorización

1. **Impacto en UX** (40%) - Mejoras que el usuario nota inmediatamente
2. **Esfuerzo de implementación** (30%) - ROI tiempo/beneficio
3. **Dependencias técnicas** (20%) - Bloqueos entre features
4. **Valor de negocio** (10%) - Retención y engagement

### Fases de Implementación

```
🔴 FASE 1: FUNDACIONES (Semana 1)     ▓▓▓▓▓▓▓▓░░ 80% crítico
🟡 FASE 2: EXPERIENCIA (Semana 2)     ▓▓▓▓▓░░░░░ 50% importante  
🟢 FASE 3: ENGAGEMENT (Semana 3)      ▓▓░░░░░░░░ 20% mejoras
```

---

## 🔴 FASE 1: FUNDACIONES Y MODELOS (Semana 1)

**Objetivo:** Preparar infraestructura y mejoras de alto impacto

### 1.1 Migraciones de Base de Datos (PRIORIDAD MÁXIMA)

**Tiempo estimado:** 2h  
**Impacto:** 🔴 BLOQUEANTE para todo lo demás

**Nuevos modelos a crear:**

1. **`RecurringTransaction`** - Gastos recurrentes automáticos
   - Campos: userId, descripcion, monto, frecuencia (mensual/quincenal/semanal), diaMes, categoriaId, cuentaId, activo, autoCrear, proximaFecha
   
2. **`Achievement`** - Sistema de logros/gamificación
   - Campos: userId, tipo (FIRST_TRANSACTION, STREAK_7, BUDGET_MET, GOAL_REACHED, etc.), desbloqueadoEn, visto
   
3. **`FinancialTip`** - Consejos financieros
   - Campos: categoria, titulo, contenido, prioridad, activo
   
4. **`FamilyGroup`** - Grupos familiares
   - Campos: nombre, codigoInvitacion, propietarioId, creadoEn
   
5. **`FamilyGroupMember`** - Miembros de grupos
   - Campos: grupoId, userId, rol (OWNER/MEMBER), unidoEn

**Extensiones a modelos existentes:**

- `User`: agregar `currentStreak`, `longestStreak`, `totalAhorrado`, `nivelGamificacion`
- `Movimiento`: agregar `recurrenteId` (FK opcional)

**Archivos a crear:**
- Nueva migración en `prisma/migrations/`

---

### 1.2 Dashboard Mejorado con Modo Compacto/Expandido

**Tiempo estimado:** 4h  
**Impacto:** 🔴 CRÍTICO - Primera impresión del usuario

**Tareas:**
- [ ] Crear estado `isCompactMode` en Dashboard
- [ ] **Modo Compacto:** Mostrar solo 3 KPIs (Balance, Ingresos, Gastos) + botón "Ver más"
- [ ] **Modo Expandido:** Mostrar todos los KPIs + proyección + salud financiera
- [ ] Toggle para cambiar entre modos (guardar preferencia en localStorage)
- [ ] Animaciones suaves de transición

**Componentes a crear:**
- `components/dashboard/compact-mode-toggle.tsx`
- `components/dashboard/kpi-grid.tsx`

**Archivos a modificar:**
- `app/(dashboard)/dashboard/page.tsx`

---

### 1.3 Semáforo de Salud Financiera + Score

**Tiempo estimado:** 3h  
**Impacto:** 🔴 CRÍTICO - Insight visual inmediato

**Tareas:**
- [ ] Crear función `calculateFinancialHealthScore()` en `lib/utils/financial-health.ts`
- [ ] Calcular score 0-100 basado en:
  - Balance positivo/negativo (25%)
  - Cumplimiento de presupuesto (25%)
  - Ratio ahorro/ingresos (25%)
  - Nivel de deuda (25%)
- [ ] Componente `FinancialHealthCard` con:
  - Score grande con color (Verde >70, Amarillo 40-70, Rojo <40)
  - Mensaje contextual ("Excelente", "Necesita atención", etc.)
  - Barra de progreso circular
- [ ] Integrar en Dashboard (modo expandido)

**Componentes a crear:**
- `components/dashboard/financial-health-card.tsx`
- `lib/utils/financial-health.ts`

---

### 1.4 Proyección de Balance a Fin de Mes

**Tiempo estimado:** 2h  
**Impacto:** 🟡 ALTA - Ayuda a planificar

**Tareas:**
- [ ] Crear función `calculateProjectedBalance()` en `lib/services/finance.service.ts`
- [ ] Calcular basado en:
  - Balance actual
  - Gastos recurrentes pendientes del mes
  - Ingresos esperados (promedio histórico)
- [ ] Componente `ProjectedBalanceCard`
- [ ] Mostrar diferencia vs balance actual (con flecha ↑/↓)

**Componentes a crear:**
- `components/dashboard/projected-balance-card.tsx`

---

### 1.5 FAB (Floating Action Button) Global

**Tiempo estimado:** 3h  
**Impacto:** 🔴 CRÍTICO - UX fluida

**Tareas:**
- [ ] Crear componente `FloatingActionButton` reutilizable
- [ ] Versión simple: Un botón "+" para agregar gasto
- [ ] Versión expandible: Botón "+" que abre menú con 3 opciones:
  - Agregar Ingreso 📈
  - Agregar Gasto 📉
  - Agregar Transferencia 🔄
- [ ] Posicionamiento fixed bottom-right (con safe area para mobile)
- [ ] Animaciones de apertura/cierre
- [ ] Integrar en Dashboard y Movimientos

**Componentes a crear:**
- `components/floating-action-button.tsx`
- `components/fab-menu.tsx`

**Archivos a modificar:**
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/movimientos/page.tsx`

---

### 1.6 Comparación Mes Actual vs Anterior

**Tiempo estimado:** 2h  
**Impacto:** 🟡 ALTA - Contexto de tendencias

**Tareas:**
- [ ] Crear función `getMonthComparison()` en finance.service
- [ ] Calcular:
  - Ingresos mes actual vs anterior (diferencia % y absoluta)
  - Gastos mes actual vs anterior (diferencia % y absoluta)
  - Balance mes actual vs anterior
- [ ] Componente `MonthComparisonCard`
- [ ] Mostrar con flechas ↑/↓ y colores (verde para mejor, rojo para peor)

**Componentes a crear:**
- `components/dashboard/month-comparison-card.tsx`

---

**📊 FASE 1 - Resumen:**
- ⏱️ **Tiempo total:** ~16 horas
- 🎯 **Entregables:** 6 mejoras críticas + migraciones BD
- ✅ **Resultado:** Dashboard profesional + base de datos lista

---

## 🟡 FASE 2: EXPERIENCIA Y FUNCIONALIDADES (Semana 2)

### 2.1 Gastos Recurrentes Automáticos

**Tiempo estimado:** 6h  
**Impacto:** 🟡 ALTA - Feature muy solicitada

**Tareas:**
- [ ] Crear página `/app/(dashboard)/recurrentes/page.tsx`
- [ ] Vista de lista de gastos recurrentes con:
  - Card por cada recurrente (monto, frecuencia, próxima fecha)
  - Badge de "Próximo" si falta <3 días
  - Toggle activo/inactivo
- [ ] Formulario de crear/editar recurrente:
  - Descripción, monto, categoría, cuenta
  - Frecuencia (mensual/quincenal/semanal)
  - Día del mes (para mensual)
  - Auto-crear (sí/no)
- [ ] Función `calculateNextDate()` para calcular próxima ocurrencia
- [ ] Endpoint API `/api/v1/recurrentes` (GET, POST, PUT, DELETE)
- [ ] Integración con sistema de notificaciones (recordatorio 1 día antes)

**Componentes a crear:**
- `components/recurrentes/recurrent-transaction-card.tsx`
- `components/recurrentes/recurrent-form.tsx`
- `app/api/v1/recurrentes/route.ts`
- `app/api/v1/recurrentes/[id]/route.ts`

---

### 2.2 Alertas Inteligentes (Smart Alerts)

**Tiempo estimado:** 5h  
**Impacto:** 🟡 ALTA - Engagement y retención

**Tareas:**
- [ ] Crear función `generateSmartAlerts()` en `lib/services/alerts.service.ts`
- [ ] Tipos de alertas:
  - 🔴 Presupuesto excedido (>100%)
  - 🟡 Presupuesto en riesgo (>80%)
  - 💳 Deuda de tarjeta alta
  - 📅 Recordatorio de reconciliación
  - 🎉 Meta alcanzada
  - 💡 Patrón detectado ("Gastas más los viernes")
- [ ] Componente `SmartAlertCard` con:
  - Icono según tipo
  - Título y mensaje
  - Acción sugerida (botón CTA)
- [ ] Stack de alertas en Dashboard (máximo 3 visibles)
- [ ] Marcar alerta como vista/descartada
- [ ] Almacenar en BD (tabla SmartAlert)

**Componentes a crear:**
- `components/alerts/smart-alert-card.tsx`
- `components/alerts/smart-alerts-stack.tsx`
- `lib/services/alerts.service.ts`

---

### 2.3 Formulario de Transacción: Modo Rápido/Completo

**Tiempo estimado:** 4h  
**Impacto:** 🟡 ALTA - Reduce fricción

**Tareas:**
- [ ] Agregar toggle "Modo Rápido" / "Modo Completo" en formulario
- [ ] **Modo Rápido:** Solo mostrar:
  - Descripción
  - Monto
  - Categoría (con categorías frecuentes como botones grandes)
  - Botón "Guardar"
- [ ] **Modo Completo:** Mostrar todos los campos actuales
- [ ] Calcular categorías frecuentes desde `lib/services/finance.service.ts`
- [ ] Guardar preferencia de modo en localStorage

**Archivos a modificar:**
- Formulario de crear/editar movimiento

---

### 2.4 Gráficos Interactivos (Click para Filtrar)

**Tiempo estimado:** 4h  
**Impacto:** 🟡 MEDIA - UX moderna

**Tareas:**
- [ ] Hacer gráfico de "Gastos por Categoría" clickeable
- [ ] Al hacer click en una categoría:
  - Navegar a `/movimientos` con filtro aplicado
  - Mostrar solo transacciones de esa categoría
  - Destacar filtro activo con badge
- [ ] Agregar tooltip al hover en gráficos
- [ ] Animaciones suaves en transiciones

**Archivos a modificar:**
- Componente de gráfico de categorías en Dashboard

---

### 2.5 Búsqueda Semántica Mejorada

**Tiempo estimado:** 3h  
**Impacto:** 🟡 MEDIA - Power users

**Tareas:**
- [ ] Crear función `applySmartSearch()` en movimientos
- [ ] Soportar queries naturales:
  - "Gastos de enero" → filtrar por mes
  - "Más de 100000" → filtrar por monto
  - "Sin categoría" → transacciones sin categorizar
  - "Pendientes" → no conciliados
  - "Uber" → búsqueda por descripción
- [ ] Agregar SearchBar con diseño moderno
- [ ] Sugerencias de búsqueda (autocomplete)

**Componentes a crear:**
- `components/movimientos/smart-search-bar.tsx`
- `lib/utils/smart-search.ts`

---

### 2.6 Exportación CSV/PDF

**Tiempo estimado:** 4h  
**Impacto:** 🟡 MEDIA - Feature solicitada

**Tareas:**
- [ ] **Exportar CSV:**
  - Botón en `/movimientos`
  - Generar CSV con todas las transacciones filtradas
  - Usar biblioteca `papaparse` para generar CSV
  - Descargar archivo automáticamente
- [ ] **Exportar PDF:**
  - Botón en Dashboard
  - Generar reporte mensual con:
    - Resumen de KPIs
    - Gráfico de gastos por categoría
    - Lista de transacciones
  - Usar biblioteca `jsPDF` o `react-pdf`
  - Diseño profesional con logo y colores de marca

**Componentes a crear:**
- `components/export/export-csv-button.tsx`
- `components/export/export-pdf-button.tsx`
- `lib/utils/csv-exporter.ts`
- `lib/utils/pdf-exporter.ts`

---

### 2.7 Vista Semanal de Gastos

**Tiempo estimado:** 3h  
**Impacto:** 🟢 MEDIA - Insight útil

**Tareas:**
- [ ] Crear página o modal `/dashboard/semanal`
- [ ] Gráfico de barras con gastos por día de la semana (L-D)
- [ ] Calcular promedio por día
- [ ] Destacar día con mayor gasto
- [ ] Insights: "Gastas más los viernes"

**Componentes a crear:**
- `components/analytics/weekly-expenses-chart.tsx`

---

### 2.8 Heatmap de Gastos (Calendario)

**Tiempo estimado:** 4h  
**Impacto:** 🟢 MEDIA - Visualización moderna

**Tareas:**
- [ ] Crear componente calendario estilo GitHub contributions
- [ ] Colorear días según intensidad de gasto:
  - Verde claro: poco gasto
  - Verde oscuro: mucho gasto
  - Gris: sin transacciones
- [ ] Tooltip al hover con monto exacto
- [ ] Click en día para ver transacciones

**Componentes a crear:**
- `components/analytics/expense-heatmap.tsx`

---

**📊 FASE 2 - Resumen:**
- ⏱️ **Tiempo total:** ~33 horas
- 🎯 **Entregables:** 8 funcionalidades principales
- ✅ **Resultado:** App completa y funcional

---

## 🟢 FASE 3: ENGAGEMENT Y OPTIMIZACIONES (Semana 3)

### 3.1 Sistema de Gamificación (Streaks + Logros)

**Tiempo estimado:** 6h  
**Impacto:** 🟢 MEDIA - Retención

**Tareas:**
- [ ] Calcular `currentStreak` en User:
  - Días consecutivos con al menos 1 transacción
  - Actualizar cada vez que se crea un movimiento
- [ ] Página `/gamificacion` con:
  - Card de racha actual 🔥
  - Lista de logros desbloqueados
  - Progreso hacia próximo logro
- [ ] Sistema de logros:
  - "Primer Paso" (primera transacción)
  - "Racha de 7 días"
  - "Presupuesto cumplido"
  - "Meta alcanzada"
  - "Nivel Plata" (ahorrado >$1,000,000)
- [ ] Badge en navbar con racha actual
- [ ] Animación/celebración al desbloquear logro

**Componentes a crear:**
- `components/gamification/streak-card.tsx`
- `components/gamification/achievement-card.tsx`
- `components/gamification/achievement-unlock-modal.tsx`
- `lib/services/gamification.service.ts`

---

### 3.2 Consejos Financieros (Tips Diarios)

**Tiempo estimado:** 3h  
**Impacto:** 🟢 MEDIA - Educación

**Tareas:**
- [ ] Crear tabla `FinancialTip` con ~30 tips predefinidos
- [ ] Categorías: Presupuesto, Ahorro, Deuda, Hábitos
- [ ] Componente `DailyTipCard` en Dashboard
- [ ] Mostrar tip random del día (guardar en cache)
- [ ] Botón "Ver más tips" → página `/educacion`
- [ ] Página de educación con:
  - Lista de tips por categoría
  - Guías interactivas (Presupuesto, Fondo de Emergencia, etc.)

**Componentes a crear:**
- `components/education/daily-tip-card.tsx`
- `app/(dashboard)/educacion/page.tsx`

---

### 3.3 Análisis de Tendencias Anuales

**Tiempo estimado:** 4h  
**Impacto:** 🟢 MEDIA - Insights

**Tareas:**
- [ ] Crear página `/analytics/anual`
- [ ] Gráfico de líneas: Ingresos vs Gastos por mes (últimos 12 meses)
- [ ] Gráfico de balance mensual
- [ ] Tabla resumen con todos los meses del año
- [ ] Calcular tendencia (mejorando/empeorando)

**Componentes a crear:**
- `components/analytics/annual-trends-chart.tsx`
- `app/(dashboard)/analytics/anual/page.tsx`

---

### 3.4 Onboarding Interactivo

**Tiempo estimado:** 5h  
**Impacto:** 🟢 ALTA - Primera impresión

**Tareas:**
- [ ] Detectar si es primera vez del usuario
- [ ] Modal/página de onboarding con 4 pasos:
  1. Bienvenida + explicación de la app
  2. Crear primera cuenta
  3. Elegir categorías (Básica/Completa)
  4. Agregar primera transacción (guiado)
- [ ] Indicador de progreso (1/4, 2/4, etc.)
- [ ] Botones Atrás/Continuar/Saltar
- [ ] Guardar en User: `onboardingCompleted = true`

**Componentes a crear:**
- `components/onboarding/onboarding-modal.tsx`
- `components/onboarding/onboarding-step.tsx`

---

### 3.5 Empty States Mejorados

**Tiempo estimado:** 2h  
**Impacto:** 🟢 BAJA - Pulido

**Tareas:**
- [ ] Crear componente `EmptyState` reutilizable
- [ ] Props: icono, título, mensaje, actionTitle, action
- [ ] Usar en todas las vistas vacías:
  - Dashboard sin datos
  - Movimientos sin transacciones
  - Recurrentes sin gastos recurrentes
  - Etc.
- [ ] Mensaje educativo + botón CTA claro

**Componentes a crear:**
- `components/empty-state.tsx`

---

### 3.6 Edición Inline de Transacciones

**Tiempo estimado:** 4h  
**Impacto:** 🟢 MEDIA - UX fluida

**Tareas:**
- [ ] Hacer monto y categoría editables directamente en lista
- [ ] Click en monto → input inline para editar
- [ ] Click en categoría → dropdown inline
- [ ] Guardar automáticamente al cambiar
- [ ] Animación de guardado (checkmark verde)

**Archivos a modificar:**
- Componente de fila de transacción en lista de movimientos

---

### 3.7 Importación CSV de Movimientos

**Tiempo estimado:** 4h  
**Impacto:** 🟢 MEDIA - Migración fácil

**Tareas:**
- [ ] Botón "Importar CSV" en `/movimientos`
- [ ] Modal de importación con:
  - Upload de archivo CSV
  - Preview de primeras 5 filas
  - Mapeo de columnas (descripción, monto, fecha, etc.)
  - Seleccionar transacciones a importar
- [ ] Parser inteligente que detecta formato de banco
- [ ] Categorización automática basada en descripción
- [ ] Endpoint API `/api/v1/import/csv`

**Componentes a crear:**
- `components/import/csv-import-modal.tsx`
- `lib/utils/csv-parser.ts`

---

### 3.8 Sistema de Grupos Familiares (Básico)

**Tiempo estimado:** 6h  
**Impacto:** 🟢 BAJA - Feature avanzada

**Tareas:**
- [ ] Crear página `/familia`
- [ ] Crear grupo familiar:
  - Nombre del grupo
  - Generar código de invitación (6 dígitos)
- [ ] Unirse a grupo:
  - Ingresar código de invitación
  - Aceptar invitación
- [ ] Vista de grupo:
  - Lista de miembros
  - Rol (Propietario/Miembro)
  - Balance compartido (opcional)
- [ ] Permisos:
  - Solo propietario puede eliminar grupo
  - Miembros pueden ver datos compartidos
- [ ] Endpoints API `/api/v1/familia`

**Componentes a crear:**
- `app/(dashboard)/familia/page.tsx`
- `components/familia/create-group-modal.tsx`
- `components/familia/join-group-modal.tsx`

---

### 3.9 Web Push Notifications

**Tiempo estimado:** 4h  
**Impacto:** 🟢 MEDIA - Engagement

**Tareas:**
- [ ] Implementar Web Push API (Notification API del navegador)
- [ ] Solicitar permisos al usuario
- [ ] Tipos de notificaciones:
  - Recordatorio de gasto recurrente (1 día antes)
  - Alerta de presupuesto excedido
  - Recordatorio de reconciliación (día 5 del mes)
  - Logro desbloqueado
- [ ] Configuración en Settings: activar/desactivar notificaciones
- [ ] Service Worker para manejar notificaciones en background

**Archivos a crear:**
- `public/service-worker.js`
- `lib/services/notifications.service.ts`
- Configuración en Settings

---

**📊 FASE 3 - Resumen:**
- ⏱️ **Tiempo total:** ~38 horas
- 🎯 **Entregables:** 9 mejoras de engagement
- ✅ **Resultado:** App completa nivel Enterprise

---

## 📊 Resumen Final del Plan

### Por Fase

| Fase | Tiempo | Features | Prioridad | Estado |
|------|--------|----------|-----------|--------|
| **FASE 1: Fundaciones** | 16h | 6 | 🔴 Crítica | ⏳ Pendiente |
| **FASE 2: Experiencia** | 33h | 8 | 🟡 Alta | ⏳ Pendiente |
| **FASE 3: Engagement** | 38h | 9 | 🟢 Media | ⏳ Pendiente |
| **TOTAL** | **87h** | **23** | - | - |

### Por Categoría

| Categoría | Features | Tiempo |
|-----------|----------|--------|
| Dashboard & Analytics | 8 | 25h |
| Transacciones & UX | 5 | 18h |
| Gamificación & Engagement | 4 | 16h |
| Integraciones | 3 | 12h |
| Infraestructura (BD) | 3 | 16h |

---

## 🎯 Próximos Pasos Inmediatos

### 1. Crear Migraciones de BD ⚡ (HOY)

```bash
# Orden de ejecución:
1. Actualizar prisma/schema.prisma
2. Ejecutar: npx prisma db push (o migrate dev)
3. Ejecutar: npx prisma generate
```

### 2. Comenzar FASE 1 (Esta semana)

**Orden sugerido:**
1. ✅ Migraciones BD (2h)
2. ✅ Dashboard modo compacto/expandido (4h)
3. ✅ Semáforo de salud financiera (3h)
4. ✅ FAB global (3h)
5. ✅ Proyección de balance (2h)
6. ✅ Comparación mensual (2h)

**Total FASE 1:** 16 horas → **2 días de trabajo**

---

## 📚 Dependencias Técnicas

### Nuevas Bibliotecas a Instalar

```bash
# Para exportación
npm install papaparse jspdf @types/papaparse

# Para notificaciones Web Push (opcional, nativo del navegador)
# No requiere instalación

# Para gráficos interactivos (si no está)
npm install recharts
```

### Configuraciones Adicionales

- **Service Worker**: Para Web Push Notifications
- **App Group** (no aplica en web): Solo si sincronización entre web/móvil
- **iCloud** (no aplica en web): Ya sincronizado por backend

---

## 🚨 Riesgos y Mitigaciones

### Riesgos Identificados

1. **Complejidad de migraciones BD**: 
   - Mitigación: Empezar con BD vacía o backup
   
2. **Web Push no funciona en todos navegadores**:
   - Mitigación: Feature progresivo (funciona si soportado, se oculta si no)
   
3. **Gamificación puede ser compleja**:
   - Mitigación: Implementar MVP primero, iterar después

---

## ✅ Criterios de Aceptación

### FASE 1 Completa cuando:
- ✅ Migraciones ejecutadas sin errores
- ✅ Dashboard tiene modo compacto/expandido funcional
- ✅ Semáforo de salud financiera muestra score correcto
- ✅ FAB visible en Dashboard y Movimientos
- ✅ Proyección muestra balance proyectado
- ✅ Comparación mensual muestra diferencias

### FASE 2 Completa cuando:
- ✅ Gastos recurrentes se pueden crear y gestionar
- ✅ Alertas inteligentes se generan automáticamente
- ✅ Formulario tiene modo rápido funcional
- ✅ Gráficos son clickeables y filtran
- ✅ Búsqueda semántica funciona con queries naturales
- ✅ Exportación CSV/PDF genera archivos correctos
- ✅ Vista semanal y heatmap muestran datos

### FASE 3 Completa cuando:
- ✅ Sistema de gamificación calcula streaks y logros
- ✅ Tips diarios se muestran en Dashboard
- ✅ Vista anual muestra tendencias de 12 meses
- ✅ Onboarding guía a nuevos usuarios
- ✅ Empty states son educativos y útiles
- ✅ Edición inline funciona en transacciones
- ✅ Importación CSV procesa archivos bancarios
- ✅ Grupos familiares permiten compartir datos
- ✅ Notificaciones web se envían correctamente

---

## 📈 Métricas de Éxito

### KPIs a Medir

| Métrica | Antes | Objetivo | Cómo Medir |
|---------|-------|----------|------------|
| Tiempo para agregar gasto | ~30s | <10s | Con FAB + modo rápido |
| Retención Día 7 | ? | +20% | Con gamificación |
| Sesiones por usuario/semana | ? | +30% | Con notificaciones |
| % usuarios que exportan | 0% | 15% | Feature nueva |
| NPS (Net Promoter Score) | ? | >50 | Encuesta post-implementación |

---

**🎯 Siguiente paso:** Crear migraciones de BD y comenzar FASE 1

**⏱️ Tiempo estimado total:** 87 horas (~3.5 semanas full-time o 6 semanas part-time)

---

*Plan creado: 14 Feb 2026, 05:00 CLT*  
*Próxima actualización: Después de completar FASE 1*
