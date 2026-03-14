# Type Safety & Type Guards

## Resumen

Se eliminaron todos los castings peligrosos (`as`) y tipos `any` del sistema de chat, reemplazándolos por type guards estrictos con narrowing de TypeScript.

## Archivos creados

### `lib/types/chat.ts`

Contiene todos los tipos y type guards del sistema de mensajería:

| Export | Tipo | Descripción |
|--------|------|-------------|
| `ChatMessagePart` | Type | Parte de un mensaje (texto u otro) |
| `UIMessage` | Type | Mensaje AI SDK v6 con `parts[]` |
| `LegacyMessage` | Type | Mensaje legacy con `content` |
| `ChatMessage` | Type | Unión de UIMessage y LegacyMessage |
| `ChatIntent` | Type | Intenciones posibles del chatbot |
| `ChatIntentParameters` | Type | Parámetros extraídos (categoría, fechas) |
| `ClassifiedIntent` | Type | Resultado de clasificación |
| `isUIMessage()` | Guard | Valida formato UIMessage |
| `isLegacyMessage()` | Guard | Valida formato legacy |
| `isUIMessageArray()` | Guard | Valida array de mensajes |
| `extractMessageContent()` | Helper | Extrae texto de cualquier formato |
| `getLastUserMessage()` | Helper | Obtiene último mensaje del usuario |

## Archivos modificados

### `app/api/chat/route.ts`

- Se eliminaron las funciones inline `getLastUserMessageContent()` y `extractContent()` que usaban castings `as`
- Se reemplazaron por `getLastUserMessage()` importado desde `@/lib/types/chat`
- Se movió `session` fuera del try para acceso en catch block

## Principios aplicados

1. **No `any`**: Todos los parámetros tienen tipos explícitos
2. **No `as` assertions**: Se usa narrowing con `typeof`, `in`, `Array.isArray()`
3. **Type guards**: Funciones que retornan `x is Type` para narrowing seguro
4. **Exhaustive checks**: Los guards verifican estructura completa del objeto
