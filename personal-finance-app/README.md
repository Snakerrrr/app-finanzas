# 💰 FinanzasCL - Gestión de Finanzas Personales

Aplicación web moderna para gestión de finanzas personales con **Búsqueda Inteligente con IA Local** y **Sincronización en la Nube Encriptada (E2EE)**.

## 🌟 Características Principales

### 🔍 Búsqueda Inteligente con IA Local
- **100% Privada**: Todo se ejecuta en tu navegador, sin enviar datos a servidores externos
- **Lenguaje Natural**: Consulta tus finanzas como si hablaras con un asistente
- **Modelo Phi-3.5-mini**: IA potente ejecutándose localmente con WebGPU
- **Creación Inteligente**: Crea transacciones hablando en lenguaje natural
- **Visualizaciones**: Gráficos de torta, barras y tablas interactivas

### ☁️ Sincronización en la Nube Encriptada (E2EE)
- **Encriptación End-to-End**: Tus datos se encriptan antes de salir de tu navegador
- **Magic Link Authentication**: Inicio de sesión sin contraseñas
- **Backup Automático**: Guarda y restaura tus datos desde cualquier dispositivo
- **Clave Personal**: Solo tú conoces la clave de encriptación

### 📊 Gestión Completa
- Movimientos financieros (Ingresos, Gastos, Transferencias)
- Presupuestos por categoría
- Tarjetas de crédito
- Metas de ahorro
- Conciliación mensual
- Categorías personalizables

---

## 🚀 Inicio Rápido

### Requisitos Previos

- **Node.js**: 18.x o superior
- **Navegador**: Chrome 113+, Edge 113+, o Safari 18+ (con WebGPU habilitado)
- **Espacio**: ~1GB libre (para el modelo de IA)

### Instalación

```bash
# 1. Clonar o navegar al proyecto
cd personal-finance-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (opcional, solo para sincronización en nube)
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 4. Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

---

## 🔍 Búsqueda Inteligente - Guía Completa

### ¿Qué es la Búsqueda Inteligente?

La Búsqueda Inteligente utiliza **WebLLM** con el modelo **Phi-3.5-mini** para entender tus consultas en lenguaje natural y convertirlas en búsquedas en tu base de datos local. Todo se ejecuta en tu navegador, garantizando **100% de privacidad**.

### Primera Vez - Carga del Modelo

La primera vez que uses la búsqueda:

1. El modelo se descargará automáticamente (~1GB)
2. Verás una barra de progreso
3. Esto toma **30-60 segundos** dependiendo de tu conexión
4. **No cierres la pestaña** durante la descarga
5. El modelo se guarda en caché para uso futuro

### Tipos de Consultas Soportadas

#### 📊 Consultas de Resumen
- `"ver saldo"` - Muestra tu saldo total actual
- `"cuánto gasté este mes"` - Total de gastos del mes actual
- `"resumen financiero"` - Resumen de ingresos y gastos

#### 🔎 Consultas Específicas
- `"gastos en comida"` - Filtra gastos de comida/supermercado
- `"gastos en transporte"` - Filtra gastos de transporte
- `"gastos del mes pasado"` - Filtra por período
- `"ver todos los gastos"` - Lista completa de gastos
- `"ver todos los ingresos"` - Lista completa de ingresos

#### 📈 Análisis y Gráficos
- `"distribución de gastos por categoría"` - Gráfico de torta
- `"evolución de gastos este mes"` - Gráfico de barras temporal
- `"gastos de ayer"` - Gastos del día anterior
- `"cuántas transacciones tengo"` - Contador de transacciones

### ✨ Crear Transacciones con IA

Puedes crear transacciones hablando en lenguaje natural:

#### Ejemplos de Creación:
- `"Gasté 50000 en el jumbo"` → Crea un gasto de $50.000 en Supermercado
- `"Compré comida por 30k"` → Crea un gasto de $30.000 en Delivery/Restaurantes
- `"Pagué 20000 en transporte"` → Crea un gasto de $20.000 en Transporte
- `"Cobré 500000 de sueldo"` → Crea un ingreso de $500.000 en Sueldo

#### Flujo de Creación con Confirmación:

1. **Escribes la transacción** en lenguaje natural
2. **La IA detecta** que quieres crear una transacción
3. **Se abre un modal** con los datos prellenados:
   - Monto (editable)
   - Categoría (editable, con dropdown)
   - Descripción (editable)
   - Fecha (editable)
4. **Revisas y editas** si es necesario
5. **Confirmas** con el botón "Guardar"
6. **Se guarda** en tu base de datos

### 🎯 Consultas Sugeridas

La interfaz incluye **consultas sugeridas organizadas por categorías**:

#### 💙 Resumen y Totales
- Balance Actual
- Total Gastos del mes
- Resumen Financiero

#### 💚 Consultas Específicas
- Gastos en Comida
- Transporte del Mes
- Gastos del mes pasado
- Ver Todos los Gastos/Ingresos

#### 💜 Análisis y Gráficos
- Distribución por Categoría
- Evolución de Gastos
- Gastos de Ayer
- Cantidad de Transacciones

#### 🟡 Crear Transacciones (Dinámico)
- Sugerencias basadas en tus categorías
- Montos comunes predefinidos
- Lugares/comercios comunes por categoría

**Nota**: Las sugerencias solo llenan el input. Debes hacer clic en "Buscar" para ejecutar la consulta.

### 🎨 Visualizaciones

La búsqueda inteligente genera diferentes tipos de visualizaciones según tu consulta:

- **Tabla**: Lista detallada de transacciones
- **Gráfico de Torta**: Distribución por categoría
- **Gráfico de Barras**: Evolución temporal
- **Valor Único**: Total o saldo destacado

---

## ☁️ Sincronización en la Nube Encriptada (E2EE)

### ¿Qué es E2EE?

**End-to-End Encryption (E2EE)** significa que tus datos se encriptan en tu navegador **antes** de ser enviados a la nube. Ni siquiera el servidor puede leer tus datos sin tu clave personal.

### Configuración Inicial

#### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta (gratis)
3. Crea un nuevo proyecto
4. Anota tu **URL** y **Anon Key**

#### 2. Crear Tabla en Supabase

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
CREATE TABLE IF NOT EXISTS user_backups (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_data TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_backups ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios solo pueden ver/editar sus propios backups
CREATE POLICY "Users can view own backups"
  ON user_backups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backups"
  ON user_backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backups"
  ON user_backups FOR UPDATE
  USING (auth.uid() = user_id);
```

#### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

#### 4. Configurar URL de Redirección en Supabase

1. Ve a **Authentication > URL Configuration** en Supabase
2. Agrega a **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (desarrollo)
   - `https://tu-dominio.com/auth/callback` (producción)

### Uso de la Sincronización

#### Paso 1: Iniciar Sesión

1. Ve a **Configuración** → **Sincronización en la Nube**
2. Ingresa tu correo electrónico
3. Haz clic en **"Enviar Magic Link"**
4. Revisa tu correo y haz clic en el enlace
5. Serás redirigido automáticamente a la aplicación

#### Paso 2: Configurar Clave de Encriptación

⚠️ **IMPORTANTE**: Tu clave de encriptación personal:
- **NO se guarda** en ningún lado
- **Solo tú la conoces**
- Si la pierdes, **perderás acceso** a tus datos encriptados
- **Guárdala en un lugar seguro** (gestor de contraseñas recomendado)

**Recomendaciones para la clave**:
- Mínimo 8 caracteres
- Combina letras, números y símbolos
- Úsala solo para esta aplicación
- Guárdala en un gestor de contraseñas

#### Paso 3: Subir Backup a la Nube

1. Ingresa tu **clave de encriptación personal**
2. Haz clic en **"☁️ Subir a la Nube"**
3. El sistema:
   - Exporta todos tus datos (movimientos, categorías, cuentas, etc.)
   - Los encripta con tu clave
   - Los sube a Supabase
4. Verás un mensaje de éxito con la fecha de sincronización

#### Paso 4: Descargar Backup desde la Nube

1. Ingresa tu **clave de encriptación personal**
2. Haz clic en **"📥 Bajar de la Nube"**
3. El sistema:
   - Descarga el backup encriptado
   - Valida tu clave
   - Muestra un diálogo de confirmación
4. **Confirma** para restaurar tus datos
5. La página se recargará con tus datos restaurados

### Seguridad y Privacidad

#### ✅ Lo que está protegido:
- **Encriptación AES**: Tus datos se encriptan con AES-256
- **Clave personal**: Solo tú conoces la clave
- **Sin acceso del servidor**: Supabase no puede leer tus datos
- **Magic Link**: Autenticación sin contraseñas

#### ⚠️ Lo que debes proteger:
- **Tu clave de encriptación**: Si la pierdes, pierdes acceso
- **Tu cuenta de Supabase**: Protege tu sesión
- **Tu dispositivo**: Asegúrate de cerrar sesión en dispositivos compartidos

### Arquitectura de Seguridad

```
┌─────────────────┐
│  Tu Navegador   │
│                 │
│  1. Datos       │
│  2. Encripta    │ ────┐
│  3. Sube        │     │
└─────────────────┘     │
                        │ (Encriptado)
                        ▼
┌─────────────────┐
│    Supabase     │
│                 │
│  Solo almacena  │
│  datos encript. │
│  No puede leer  │
└─────────────────┘
```

---

## 🏗️ Arquitectura Técnica

### Búsqueda Inteligente

```
Usuario → SmartSearch → useLocalBrain → WebLLM (Phi-3.5-mini)
                              ↓
                    JSON estructurado
                              ↓
                    query-executor → Dexie → Resultados
```

**Componentes principales**:
- `hooks/use-local-brain.ts`: Gestiona WebLLM y conversión a JSON
- `lib/query-executor.ts`: Ejecuta consultas en Dexie
- `components/smart-search.tsx`: Interfaz de usuario
- `components/transaction-review-card.tsx`: Modal de confirmación

### Sincronización en la Nube

```
Usuario → CloudSyncPanel → useCloudSync → Supabase
                ↓
         crypto.ts (AES)
                ↓
         Datos encriptados
```

**Componentes principales**:
- `lib/supabase.ts`: Cliente de Supabase
- `lib/crypto.ts`: Encriptación/desencriptación AES
- `hooks/useCloudSync.ts`: Lógica de sincronización
- `components/cloud-sync-panel.tsx`: Interfaz de usuario

### Base de Datos Local

- **Dexie.js**: Base de datos IndexedDB
- **Almacenamiento**: Navegador (persistente)
- **Sincronización**: Con DataContext (localStorage)

---

## 🐛 Solución de Problemas

### Búsqueda Inteligente

#### ❌ "Error al cargar el modelo"
**Causas posibles**:
- WebGPU no disponible
- Memoria insuficiente
- Conexión a internet lenta (primera descarga)

**Soluciones**:
1. Verifica que WebGPU esté habilitado: `chrome://gpu`
2. Cierra otras pestañas que usen WebGPU
3. Recarga la página (F5)
4. Usa Chrome/Edge (mejor soporte)

#### ❌ "El modelo tarda mucho en cargar"
**Normal en la primera carga**:
- El modelo pesa ~1GB
- Se descarga solo una vez
- Se guarda en caché

**Si tarda demasiado**:
- Verifica tu conexión a internet
- Revisa la pestaña Network en DevTools
- Intenta en modo incógnito

#### ❌ "No se encuentran transacciones"
**Soluciones**:
1. Verifica en DevTools > Application > IndexedDB
2. Recarga la página
3. La base de datos se inicializa automáticamente

### Sincronización en la Nube

#### ❌ "Error al enviar Magic Link"
**Soluciones**:
1. Verifica que las variables de entorno estén configuradas
2. Revisa que el email sea válido
3. Verifica la configuración de Supabase

#### ❌ "Contraseña de encriptación incorrecta"
**Causa**: La clave ingresada no coincide con la usada para encriptar

**Solución**: 
- Asegúrate de usar la misma clave que usaste para subir el backup
- Si la perdiste, no podrás recuperar los datos (por diseño de seguridad)

#### ❌ "No se encontró ningún backup en la nube"
**Causa**: No has subido un backup todavía

**Solución**: 
- Primero sube un backup usando "Subir a la Nube"

#### ❌ "Error al restaurar datos"
**Soluciones**:
1. Verifica tu conexión a internet
2. Asegúrate de que la clave sea correcta
3. Revisa la consola del navegador para más detalles

---

## 📚 Recursos y Referencias

### Tecnologías Utilizadas

- **Next.js 16**: Framework React
- **WebLLM**: Motor de IA local
- **Phi-3.5-mini**: Modelo de lenguaje
- **Dexie.js**: Base de datos IndexedDB
- **Supabase**: Backend como servicio
- **Crypto-JS**: Encriptación AES
- **Recharts**: Gráficos y visualizaciones

### Documentación Externa

- [WebLLM Documentation](https://webllm.mlc.ai/)
- [Supabase Documentation](https://supabase.com/docs)
- [Dexie.js Documentation](https://dexie.org/)
- [Crypto-JS Documentation](https://cryptojs.gitbook.io/docs/)

---

## 🔒 Privacidad y Seguridad

### Búsqueda Inteligente
- ✅ **100% Local**: Todo se ejecuta en tu navegador
- ✅ **Sin API Keys**: No requiere servicios externos
- ✅ **Sin Tracking**: No se envían datos a servidores
- ✅ **Costo $0**: No hay costos de tokens

### Sincronización en la Nube
- ✅ **Encriptación E2EE**: Datos encriptados antes de salir del navegador
- ✅ **Clave Personal**: Solo tú conoces la clave
- ✅ **Magic Link**: Autenticación sin contraseñas
- ✅ **RLS en Supabase**: Row Level Security activado

---

## 📝 Notas Importantes

### Búsqueda Inteligente
- La primera carga del modelo es lenta (~30-60 segundos)
- El modelo se guarda en caché para uso futuro
- Requiere WebGPU (Chrome/Edge recomendado)
- Usa ~2-3GB de RAM durante ejecución

### Sincronización en la Nube
- **Guarda tu clave de encriptación**: Si la pierdes, pierdes acceso
- Los backups se sobrescriben (solo se guarda el último)
- La restauración reemplaza todos los datos locales
- Siempre confirma antes de restaurar

---

## 🆘 ¿Necesitas Ayuda?

1. **Revisa la consola del navegador** (F12 > Console)
2. **Revisa la pestaña Network** para errores de descarga
3. **Verifica las variables de entorno** para Supabase
4. **Consulta la documentación** de las tecnologías utilizadas

---

## 📄 Licencia

Este proyecto es de código abierto. Consulta el archivo LICENSE para más detalles.

---

**Desarrollado con ❤️ para gestión de finanzas personales en Chile**
