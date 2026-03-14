# Telemetría & Analytics (PostHog)

## Resumen

Se integró PostHog para entender cómo los usuarios interactúan con el chatbot y las funcionalidades clave de la aplicación.

## Setup

### Instalación

```bash
npm install posthog-js
```

### Variables de entorno requeridas

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # opcional, default US
```

Para obtener la API key:
1. Crear cuenta en [posthog.com](https://posthog.com)
2. Crear proyecto
3. Copiar la Project API Key desde Settings → Project

## Archivo principal: `lib/analytics.ts`

### Funciones disponibles

| Función | Descripción | Evento PostHog |
|---------|-------------|----------------|
| `identifyUser(userId, props?)` | Identifica al usuario | `$identify` |
| `trackChatMessage(data)` | Mensaje enviado al chat | `chat_message_sent` |
| `trackIntentClassified(data)` | Intención clasificada | `chat_intent_classified` |
| `trackChatResponse(data)` | Respuesta recibida | `chat_response` |
| `trackPageView(pageName)` | Vista de página | `$pageview` |
| `trackFeatureUsed(feature, props?)` | Uso de funcionalidad | `feature_used` |
| `resetAnalytics()` | Reset al cerrar sesión | `$reset` |

### Características

- **Lazy initialization**: Solo se inicializa cuando se llama la primera función
- **Client-only**: No se ejecuta en el servidor (SSR-safe)
- **Graceful degradation**: Si no hay API key, las funciones no hacen nada
- **Debug mode**: En desarrollo, PostHog muestra logs en consola

## Integración actual

### Chat (`components/ai-assistant.tsx`)

Se trackea cada mensaje enviado:
```typescript
trackChatMessage({
  messageLength: trimmed.length,
  conversationLength: messages.length,
})
```

### Server-side (Pino Logger)

El tracking server-side se mantiene con el logger estructurado existente (`logChatEvent`), que registra:
- Intent clasificado
- Tiempo de respuesta
- Errores
- Parámetros extraídos

## Dashboard recomendado en PostHog

### Métricas clave a configurar

1. **Distribución de intenciones**: Gráfico de torta con `chat_intent_classified` agrupado por `intent`
2. **Mensajes por usuario**: Tabla con `chat_message_sent` agrupado por `distinct_id`
3. **Latencia promedio**: Línea temporal con `chat_response` → promedio de `responseTimeMs`
4. **Tasa de error**: Ratio de `chat_response` donde `success = false`
5. **Funcionalidades más usadas**: Barra con `feature_used` agrupado por `feature`

## Próximos pasos

- [ ] Configurar API key de PostHog en `.env.local`
- [ ] Crear dashboard en PostHog con las métricas listadas
- [ ] Agregar `trackPageView` en las páginas principales
- [ ] Agregar `trackFeatureUsed` en CRUD de movimientos, tarjetas, metas
- [ ] Configurar alertas para tasa de error > 5%
