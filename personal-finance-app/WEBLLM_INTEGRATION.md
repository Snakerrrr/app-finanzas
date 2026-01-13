# 🧠 Integración WebLLM - Guía Completa

## 📋 Resumen

Se ha reemplazado el sistema de clasificación simple por **WebLLM** con el modelo **Phi-3.5-mini**, ejecutándose directamente en el navegador mediante WebGPU.

## 🏗️ Arquitectura

### 1. **Hook Personalizado: `useLocalBrain.ts`**
- **Ubicación:** `hooks/use-local-brain.ts`
- **Función:** Gestiona el motor WebLLM y proporciona una interfaz simple para consultas
- **Características:**
  - Carga del modelo con barra de progreso
  - Gestión de estados (loading, ready, error)
  - Función `askDatabase()` que convierte lenguaje natural a JSON estructurado
  - Limpieza automática de respuestas del modelo para extraer JSON válido

### 2. **Ejecutor de Consultas: `query-executor.ts`**
- **Ubicación:** `lib/query-executor.ts`
- **Función:** Convierte el JSON generado por la IA en consultas Dexie.js
- **Características:**
  - Soporte para filtros complejos (tipo, categoría, fechas, montos)
  - Cálculo automático de totales
  - Mensajes descriptivos de resultados

### 3. **Componente UI: `SmartSearch.tsx`**
- **Ubicación:** `components/smart-search.tsx`
- **Función:** Interfaz de usuario para la búsqueda inteligente
- **Características:**
  - Barra de progreso durante la descarga del modelo
  - Estados visuales claros (cargando, listo, error)
  - Tabla de resultados con formato de moneda y fechas

## 🔧 Configuración Técnica

### Modelo Utilizado
- **Nombre:** `Phi-3.5-mini-instruct-q4f16_1-MLC`
- **Tamaño:** ~1GB (descarga única)
- **Precisión:** Cuantización 4-bit para optimizar rendimiento
- **Motor:** MLC AI (WebLLM)

### Requisitos del Navegador
- **WebGPU:** Requerido (Chrome 113+, Edge 113+, o Safari 18+)
- **IndexedDB:** Para almacenar el modelo en caché
- **Espacio:** ~1GB de espacio libre

### Configuración Next.js
El archivo `next.config.mjs` ha sido actualizado para:
- Soporte de WebAssembly
- Headers CORS para WebGPU
- Configuración de webpack para WebLLM

## 📝 Esquema JSON de Respuesta

El modelo genera un JSON con esta estructura:

```json
{
  "intent": "filter_transactions" | "get_balance" | "get_summary",
  "filters": {
    "type": "expense" | "income" | null,
    "category": string | null,
    "minAmount": number | null,
    "maxAmount": number | null,
    "startDate": "YYYY-MM-DD" | null,
    "endDate": "YYYY-MM-DD" | null
  }
}
```

## 🎯 Ejemplos de Consultas

### Consultas Simples
- `"ver gastos"` → Filtra todas las transacciones de tipo "expense"
- `"ver ingresos"` → Filtra todas las transacciones de tipo "income"
- `"ver saldo"` → Calcula el saldo total

### Consultas con Filtros
- `"gastos en comida"` → Filtra gastos con categoría "comida"
- `"ingresos de esta semana"` → Filtra ingresos del rango de fechas de esta semana
- `"gastos mayores a 10000"` → Filtra gastos con monto mínimo 10000
- `"transacciones del mes pasado"` → Filtra por rango de fechas del mes anterior

### Consultas Complejas
- `"gastos en supermercado de esta semana mayores a 5000"` → Múltiples filtros combinados

## 🚀 Flujo de Ejecución

1. **Inicialización:**
   - El hook `useLocalBrain` se inicializa al montar el componente
   - Descarga el modelo (~1GB) si no está en caché
   - Muestra barra de progreso durante la descarga

2. **Consulta del Usuario:**
   - Usuario escribe una consulta en lenguaje natural
   - Al enviar, se llama a `askDatabase(userQuery)`

3. **Procesamiento con IA:**
   - El modelo Phi-3.5-mini procesa la consulta
   - Genera un JSON estructurado según el system prompt
   - Se limpia el texto para extraer solo el JSON

4. **Ejecución en Base de Datos:**
   - `executeDatabaseQuery()` recibe el JSON
   - Construye la consulta Dexie.js correspondiente
   - Ejecuta la consulta y calcula totales

5. **Visualización:**
   - Los resultados se muestran en una tabla
   - Se muestra un mensaje descriptivo con el resumen

## ⚙️ System Prompt

El system prompt está diseñado para:
- **Máxima precisión:** Instruye al modelo a devolver SOLO JSON
- **Determinismo:** `temperature: 0` para respuestas consistentes
- **Contexto temporal:** Incluye la fecha actual para cálculos relativos
- **Validación:** Estructura estricta del JSON esperado

## 🐛 Manejo de Errores

### Errores Comunes

1. **"El modelo no está listo"**
   - **Causa:** El modelo aún se está cargando
   - **Solución:** Esperar a que termine la descarga

2. **"El modelo no devolvió un JSON válido"**
   - **Causa:** El modelo generó texto adicional además del JSON
   - **Solución:** El sistema limpia automáticamente el texto, pero si falla, revisar el system prompt

3. **"Error al cargar el modelo"**
   - **Causa:** WebGPU no disponible o error de red
   - **Solución:** Verificar que el navegador soporte WebGPU

## 📊 Rendimiento

- **Primera carga:** ~30-60 segundos (descarga de ~1GB)
- **Cargas subsecuentes:** ~5-10 segundos (desde caché)
- **Tiempo de consulta:** ~1-3 segundos (depende de la complejidad)
- **Uso de memoria:** ~2-3GB RAM durante ejecución

## 🔒 Privacidad

- ✅ **100% Local:** Todo se ejecuta en el navegador
- ✅ **Sin API Keys:** No requiere servicios externos
- ✅ **Sin Tracking:** No se envían datos a servidores
- ✅ **Costo $0:** No hay costos de tokens

## 🎨 Personalización

### Modificar el System Prompt
Edita `SYSTEM_PROMPT` en `hooks/use-local-brain.ts` para:
- Cambiar el formato del JSON
- Agregar nuevas intenciones
- Mejorar la precisión de detección

### Agregar Nuevos Filtros
Edita `query-executor.ts` para:
- Agregar nuevos tipos de filtros
- Modificar la lógica de consultas
- Personalizar mensajes de resultado

## 📚 Recursos

- [WebLLM Documentation](https://webllm.mlc.ai/)
- [MLC AI Models](https://mlc.ai/)
- [Phi-3.5-mini Model Card](https://huggingface.co/microsoft/Phi-3.5-mini-instruct)

## ✅ Checklist de Integración

- [x] Instalar `@mlc-ai/web-llm`
- [x] Crear hook `useLocalBrain`
- [x] Crear ejecutor de consultas
- [x] Actualizar componente `SmartSearch`
- [x] Configurar `next.config.mjs`
- [x] Agregar barra de progreso
- [x] Manejo de errores
- [x] Limpieza de respuestas JSON

---

**Nota:** Esta implementación reemplaza completamente el sistema anterior basado en `@xenova/transformers`. El código antiguo puede ser eliminado si ya no se necesita.
