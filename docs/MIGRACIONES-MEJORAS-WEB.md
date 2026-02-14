# 🗄️ Migraciones de Base de Datos - Mejoras Web

**Fecha de aplicación:** 14 de Febrero, 2026  
**Migración:** `add_mejoras_web_models`  
**Estado:** ✅ APLICADA EXITOSAMENTE

---

## 📊 Resumen de Cambios

### Nuevos Modelos Creados (6)

1. **`RecurringTransaction`** - Gastos recurrentes automáticos
2. **`Achievement`** - Sistema de logros/gamificación
3. **`FinancialTip`** - Consejos financieros
4. **`SmartAlert`** - Alertas inteligentes
5. **`FamilyGroup`** - Grupos familiares
6. **`FamilyGroupMember`** - Miembros de grupos

### Modelos Extendidos (2)

1. **`User`** - Agregados 6 campos para gamificación y onboarding
2. **`Movimiento`** - Agregado campo `recurrenteId` (FK a RecurringTransaction)

---

## 🆕 Modelo: RecurringTransaction

**Descripción:** Transacciones que se repiten automáticamente (gastos fijos, suscripciones, etc.)

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String | Primary Key (cuid) |
| `descripcion` | String | Descripción del gasto recurrente |
| `montoCLP` | Float | Monto en pesos chilenos |
| `frecuencia` | String | "mensual" \| "quincenal" \| "semanal" |
| `diaMes` | Int? | Día del mes (1-31) para frecuencia mensual |
| `categoriaId` | String | FK a Categoria |
| `cuentaOrigenId` | String? | FK a Cuenta (opcional) |
| `activo` | Boolean | Si está activo o pausado |
| `autoCrear` | Boolean | Si se debe crear automáticamente el movimiento |
| `proximaFecha` | Date | Próxima fecha de ocurrencia |
| `userId` | String | FK a User |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

### Índices

- `idx_userId_proximaFecha`: Para queries de "próximos gastos"
- `idx_userId_activo`: Para filtrar solo activos

### Relaciones

- `User` (1:N) - Un usuario tiene muchos gastos recurrentes
- `Movimiento` (1:N) - Un recurrente puede generar muchos movimientos

---

## 🏆 Modelo: Achievement

**Descripción:** Logros desbloqueados por el usuario (gamificación)

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String | Primary Key (cuid) |
| `tipo` | String | Tipo de logro (ver tipos abajo) |
| `titulo` | String | Título del logro |
| `descripcion` | String | Descripción del logro |
| `icono` | String | Emoji o nombre de icono |
| `desbloqueadoEn` | DateTime | Fecha de desbloqueo |
| `visto` | Boolean | Si el usuario ya lo vio |
| `userId` | String | FK a User |
| `createdAt` | DateTime | Fecha de creación |

### Tipos de Logros

```typescript
type AchievementType =
  | "FIRST_TRANSACTION"     // Primera transacción registrada
  | "STREAK_7"              // 7 días consecutivos
  | "STREAK_30"             // 30 días consecutivos
  | "BUDGET_MET"            // Presupuesto cumplido
  | "GOAL_REACHED"          // Meta de ahorro alcanzada
  | "LEVEL_SILVER"          // Nivel Plata (>$1,000,000 ahorrados)
  | "LEVEL_GOLD"            // Nivel Oro (>$5,000,000 ahorrados)
  | "LEVEL_PLATINUM"        // Nivel Platino (>$10,000,000 ahorrados)
```

### Índices

- `idx_userId_desbloqueadoEn`: Para ordenar por fecha
- `idx_userId_visto`: Para filtrar no vistos

---

## 💡 Modelo: FinancialTip

**Descripción:** Consejos financieros educativos

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String | Primary Key (cuid) |
| `categoria` | String | "Presupuesto" \| "Ahorro" \| "Deuda" \| "Hábitos" \| "Inversión" |
| `titulo` | String | Título del consejo |
| `contenido` | String | Contenido completo del tip |
| `prioridad` | Int | 1-10, más alto = más importante |
| `activo` | Boolean | Si está activo o archivado |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

### Índices

- `idx_activo_prioridad`: Para filtrar activos y ordenar por prioridad

### Datos Iniciales

✅ **30 tips financieros en español chileno** ya insertados, distribuidos en:
- 8 tips de Presupuesto
- 8 tips de Ahorro
- 6 tips de Deuda
- 5 tips de Hábitos
- 3 tips de Inversión

---

## 🚨 Modelo: SmartAlert

**Descripción:** Alertas inteligentes generadas automáticamente

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String | Primary Key (cuid) |
| `tipo` | String | Tipo de alerta (ver tipos abajo) |
| `titulo` | String | Título de la alerta |
| `mensaje` | String | Mensaje completo |
| `prioridad` | String | "baja" \| "media" \| "alta" |
| `accion` | String? | Texto del botón CTA |
| `accionUrl` | String? | URL del CTA |
| `visto` | Boolean | Si fue vista |
| `descartado` | Boolean | Si fue descartada |
| `userId` | String | FK a User |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

### Tipos de Alertas

```typescript
type SmartAlertType =
  | "BUDGET_EXCEEDED"       // Presupuesto excedido (>100%)
  | "BUDGET_WARNING"        // Presupuesto en riesgo (>80%)
  | "HIGH_DEBT"             // Deuda de tarjeta alta
  | "RECONCILE_REMINDER"    // Recordatorio de reconciliación
  | "GOAL_ACHIEVED"         // Meta alcanzada 🎉
  | "PATTERN_DETECTED"      // Patrón detectado ("Gastas más los viernes")
```

### Índices

- `idx_userId_visto_descartado`: Para filtrar no vistas/no descartadas
- `idx_userId_createdAt`: Para ordenar por fecha

---

## 👨‍👩‍👧‍👦 Modelo: FamilyGroup

**Descripción:** Grupos familiares para compartir finanzas

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String | Primary Key (cuid) |
| `nombre` | String | Nombre del grupo |
| `codigoInvitacion` | String | Código único para unirse (6 dígitos) |
| `propietarioId` | String | FK a User (creador del grupo) |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

### Índices

- `idx_propietarioId`: Para queries de grupos por propietario
- `unique_codigoInvitacion`: Código de invitación debe ser único

---

## 👥 Modelo: FamilyGroupMember

**Descripción:** Miembros de grupos familiares

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String | Primary Key (cuid) |
| `grupoId` | String | FK a FamilyGroup |
| `userId` | String | FK a User |
| `rol` | String | "owner" \| "member" |
| `unidoEn` | DateTime | Fecha de unión |

### Índices

- `idx_userId`: Para queries de grupos de un usuario
- `idx_grupoId`: Para queries de miembros de un grupo
- `unique_grupoId_userId`: Un usuario solo puede estar una vez en un grupo

---

## 🔄 Extensión: User

### Nuevos Campos

| Campo | Tipo | Descripción | Default |
|-------|------|-------------|---------|
| `currentStreak` | Int | Racha actual de días | 0 |
| `longestStreak` | Int | Racha más larga | 0 |
| `lastActivityDate` | Date? | Última fecha con transacción | null |
| `totalAhorrado` | Float | Total ahorrado histórico | 0 |
| `nivelGamificacion` | String | Nivel actual | "Bronce" |
| `onboardingCompleted` | Boolean | Si completó onboarding | false |

### Niveles de Gamificación

```typescript
type NivelGamificacion =
  | "Bronce"    // $0 - $999,999
  | "Plata"     // $1,000,000 - $4,999,999
  | "Oro"       // $5,000,000 - $9,999,999
  | "Platino"   // $10,000,000+
```

---

## 🔄 Extensión: Movimiento

### Nuevo Campo

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `recurrenteId` | String? | FK a RecurringTransaction |

**Uso:** Si un movimiento fue creado automáticamente desde un gasto recurrente, este campo apunta al origen.

---

## 🗂️ Estructura Completa de Relaciones

```
User
├── accounts (Account[])
├── sessions (Session[])
├── categorias (Categoria[])
├── cuentas (Cuenta[])
├── tarjetasCredito (TarjetaCredito[])
├── metasAhorro (MetaAhorro[])
├── presupuestos (Presupuesto[])
├── movimientos (Movimiento[])
├── recurringTransactions (RecurringTransaction[])  ← NUEVO
├── achievements (Achievement[])                     ← NUEVO
├── alerts (SmartAlert[])                            ← NUEVO
├── ownedGroups (FamilyGroup[])                      ← NUEVO
└── groupMemberships (FamilyGroupMember[])           ← NUEVO

RecurringTransaction
└── movimientos (Movimiento[])                       ← NUEVO

FamilyGroup
├── propietario (User)                               ← NUEVO
└── miembros (FamilyGroupMember[])                   ← NUEVO

FamilyGroupMember
├── grupo (FamilyGroup)                              ← NUEVO
└── user (User)                                      ← NUEVO
```

---

## ✅ Verificación de Migración

### Comando ejecutado

```bash
npx prisma generate
```

**Resultado:** ✅ Cliente de Prisma generado exitosamente en 245ms

### Tablas creadas en Supabase

1. ✅ `RecurringTransaction`
2. ✅ `Achievement`
3. ✅ `FinancialTip` (con 30 tips iniciales)
4. ✅ `SmartAlert`
5. ✅ `FamilyGroup`
6. ✅ `FamilyGroupMember`

### Columnas agregadas

- ✅ `User`: 6 columnas de gamificación
- ✅ `Movimiento`: 1 columna `recurrenteId`

### Índices creados

- ✅ 10 índices nuevos para optimización

---

## 🚀 Próximos Pasos

### Inmediatos (Hoy)

1. ✅ Migración aplicada
2. ✅ Cliente Prisma generado
3. ✅ Tips financieros insertados
4. ⏳ Comenzar implementación FASE 1 del plan

### FASE 1 - Fundaciones (Esta Semana)

1. Dashboard con modo compacto/expandido
2. Semáforo de salud financiera
3. FAB (Floating Action Button)
4. Proyección de balance
5. Comparación mensual

### FASE 2 - Experiencia (Próxima Semana)

1. Gastos recurrentes (CRUD completo)
2. Alertas inteligentes
3. Formulario rápido/completo
4. Gráficos interactivos
5. Exportación CSV/PDF

### FASE 3 - Engagement (Semana 3)

1. Sistema de gamificación
2. Consejos financieros
3. Grupos familiares
4. Web Push Notifications

---

## 📚 Documentación Relacionada

- **Plan completo:** `docs/PLAN-MEJORAS-WEB.md`
- **Validación móvil:** `docs/VALIDACION_MEJORAS.md`
- **Schema Prisma:** `prisma/schema.prisma`

---

## 🛠️ Comandos Útiles

```bash
# Ver tablas en Supabase
npx prisma db pull

# Regenerar cliente
npx prisma generate

# Ver estructura de BD
npx prisma studio

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migración en producción
npx prisma migrate deploy
```

---

## ⚠️ Notas Importantes

1. **Datos de prueba:** Los 30 tips financieros ya están insertados y listos para usar
2. **Gamificación:** Los campos de `User` se actualizarán automáticamente al usar las features
3. **Recurrentes:** El campo `autoCrear` permite elegir si se crean movimientos automáticamente
4. **Alertas:** Se generan automáticamente por funciones del backend
5. **Grupos familiares:** Requiere lógica de permisos en el backend

---

**🎉 Migración completada exitosamente**

*Última actualización: 14 Feb 2026, 05:30 CLT*
