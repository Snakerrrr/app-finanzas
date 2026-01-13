# 🚀 Guía de Despliegue Local - Búsqueda Inteligente Privada

## 📋 Requisitos Previos

### 1. Node.js y npm
- **Node.js**: Versión 18.x o superior
- **npm**: Viene incluido con Node.js

Para verificar que los tienes instalados:
```bash
node --version
npm --version
```

### 2. Navegador Compatible
La funcionalidad requiere:
- **Chrome/Edge**: Versión 90+ (recomendado)
- **Firefox**: Versión 88+
- **Safari**: Versión 14+

**Características necesarias:**
- Soporte para WebAssembly (WASM)
- IndexedDB habilitado
- JavaScript ES6+

### 3. Espacio en Disco
- **Mínimo**: ~100 MB libres
- **Recomendado**: ~500 MB (para caché del modelo de IA)

## 🔧 Instalación y Configuración

### Paso 1: Navegar al Directorio del Proyecto

```bash
cd personal-finance-app
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias incluyendo:
- `dexie` (base de datos local)
- `@xenova/transformers` (IA local)
- Todas las dependencias de Next.js y React

### Paso 3: Verificar Instalación

Verifica que las dependencias críticas estén instaladas:

```bash
npm list dexie @xenova/transformers
```

Deberías ver algo como:
```
├── dexie@4.2.1
└── @xenova/transformers@2.17.2
```

## 🏃 Ejecutar el Proyecto

### Modo Desarrollo (Recomendado para pruebas)

```bash
npm run dev
```

El servidor se iniciará en: **http://localhost:3000**

### Modo Producción (Opcional)

Si quieres probar el build de producción:

```bash
# 1. Construir la aplicación
npm run build

# 2. Iniciar servidor de producción
npm start
```

## 🧪 Probar la Funcionalidad

### Paso 1: Acceder a la Aplicación

1. Abre tu navegador en: **http://localhost:3000**
2. Si es necesario, inicia sesión o regístrate
3. En el menú lateral, haz clic en **"Búsqueda Inteligente"**

### Paso 2: Primera Carga del Modelo

**⚠️ IMPORTANTE**: La primera vez que uses la búsqueda:
- El modelo de IA se descargará automáticamente (~5-10 MB)
- Esto puede tomar **30-60 segundos** dependiendo de tu conexión
- Verás un mensaje: "Cargando modelo de IA..."
- **No cierres la pestaña** durante la descarga

### Paso 3: Probar Consultas

Una vez cargado el modelo, prueba estas consultas:

#### Consultas Básicas:
- `"ver gastos"` - Muestra todos los gastos
- `"ver ingresos"` - Muestra todos los ingresos
- `"ver saldo"` - Muestra el saldo total y transacciones recientes

#### Consultas con Filtros:
- `"gastos en comida"` - Filtra gastos de comida/supermercado
- `"gastos en transporte"` - Filtra gastos de transporte
- `"gastos en bencina"` - Filtra gastos de combustible
- `"gastos en salud"` - Filtra gastos de salud/farmacia

## 🔍 Verificar que Funciona

### 1. Verificar Base de Datos Local

Abre las **DevTools del navegador** (F12):
- Ve a la pestaña **Application** (Chrome) o **Storage** (Firefox)
- Expande **IndexedDB**
- Deberías ver `FinanceAppDB` con la tabla `transactions`
- Debería tener 20 transacciones de ejemplo

### 2. Verificar Modelo de IA

En la consola del navegador (F12 > Console):
- Deberías ver: `"Modelo de IA cargado exitosamente"`
- Si hay errores, aparecerán en la consola

### 3. Verificar Resultados

- Las consultas deberían devolver resultados en una tabla
- Los montos deberían estar formateados en pesos chilenos (CLP)
- Las fechas deberían estar en formato legible

## 🐛 Solución de Problemas

### Problema: "Error al cargar el modelo de IA"

**Soluciones:**
1. Verifica tu conexión a internet (necesaria solo la primera vez)
2. Limpia la caché del navegador: `Ctrl+Shift+Delete` > Caché
3. Intenta en modo incógnito
4. Verifica que WebAssembly esté habilitado en tu navegador

### Problema: "No se encuentran transacciones"

**Soluciones:**
1. Abre la consola del navegador (F12)
2. Verifica que no haya errores de IndexedDB
3. Recarga la página (F5)
4. La base de datos se inicializa automáticamente al cargar la página

### Problema: "El modelo tarda mucho en cargar"

**Normal en la primera carga:**
- El modelo pesa ~5-10 MB
- Depende de tu velocidad de internet
- Se descarga solo una vez y se guarda en caché

**Si tarda demasiado:**
- Verifica tu conexión a internet
- Intenta recargar la página
- Verifica en DevTools > Network que la descarga esté progresando

### Problema: "Error de compilación con webpack"

Si ves errores relacionados con webpack/Turbopack:
1. Asegúrate de estar usando `npm run dev` (no `next dev --turbo`)
2. Verifica que `next.config.mjs` tenga la configuración correcta
3. Intenta eliminar `.next` y reconstruir:
   ```bash
   rm -rf .next
   npm run dev
   ```

### Problema: "CORS o WASM errors"

**Soluciones:**
1. Asegúrate de usar `http://localhost:3000` (no `file://`)
2. Verifica que los headers CORS estén configurados en `next.config.mjs`
3. Prueba en Chrome/Edge (mejor soporte para WASM)

## 📊 Datos de Prueba

La aplicación viene con **20 transacciones de ejemplo** que incluyen:
- Ingresos (sueldo, freelance)
- Gastos de comida (supermercado, delivery)
- Gastos de transporte (Bip, Uber)
- Gastos de servicios (luz, agua, internet)
- Gastos de salud (isapre, farmacia)
- Entretenimiento (cine, suscripciones)

## 🎯 Próximos Pasos

Una vez que funcione correctamente:
1. Puedes agregar más transacciones manualmente
2. Puedes mejorar las consultas en `lib/search-mapper.ts`
3. Puedes agregar más intenciones en `lib/ai-service.ts`
4. Puedes personalizar las categorías en `lib/db.ts`

## 📝 Notas Importantes

- **Privacidad**: Todo se ejecuta localmente, ningún dato sale de tu navegador
- **Costo**: $0 en tokens, todo es gratuito
- **Rendimiento**: La primera carga es lenta, pero luego es instantáneo
- **Persistencia**: Los datos se guardan en IndexedDB del navegador
- **Modelo**: Se descarga una vez y se guarda en caché del navegador

## 🆘 ¿Necesitas Ayuda?

Si encuentras problemas:
1. Revisa la consola del navegador (F12 > Console)
2. Revisa la pestaña Network para ver errores de descarga
3. Verifica que todas las dependencias estén instaladas
4. Asegúrate de usar un navegador compatible

---

¡Listo para probar! 🚀
