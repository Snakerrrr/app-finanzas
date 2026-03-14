# Refactorización Modular del Chat

## Resumen

El archivo `app/api/chat/route.ts` se redujo de ~295 líneas a ~90 líneas mediante la extracción de lógica en 3 módulos independientes.

## Arquitectura: Pipeline Router → Executor → Generator

```
Mensaje del usuario
        │
        ▼
┌─────────────────┐
│  lib/agents/    │
│  router.ts      │  classifyIntent(message) → ClassifiedIntent
│  (~40 líneas)   │  Usa OpenAI gpt-4o-mini + Zod structured outputs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  lib/agents/    │
│  executor.ts    │  executeIntent(userId, intent) → { systemContext }
│  (~100 líneas)  │  Consulta BD según intención (BALANCE, MOVIMIENTOS)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  lib/agents/    │
│  generator.ts   │  generateResponse(messages, context) → Stream
│  (~30 líneas)   │  Genera respuesta final con streaming
└─────────────────┘
```

## Archivos creados

### `lib/agents/router.ts`

- Exporta: `classifyIntent(message: string): Promise<ClassifiedIntent>`
- Usa `generateObject` con schema Zod estricto
- Intenciones: BALANCE, MOVIMIENTOS, SALUDO, AYUDA, OTRO
- Extrae parámetros: categoría, fecha inicio, fecha fin

### `lib/agents/executor.ts`

- Exporta: `executeIntent(userId: string, intention: ClassifiedIntent): Promise<ExecutorResult>`
- Tipo `ExecutorResult`: `{ systemContext: string }`
- Funciones privadas: `executeBalance()`, `executeMovimientos()`
- Manejo de errores con logging estructurado

### `lib/agents/generator.ts`

- Exporta: `generateResponse(messages: unknown[], systemContext: string)`
- System prompt centralizado como constante
- Usa `streamText` + `convertToModelMessages`

## Archivo simplificado

### `app/api/chat/route.ts` (~90 líneas)

```typescript
// Pipeline limpio de 3 líneas:
const intention = await classifyIntent(lastUserMessage)
const { systemContext } = await executeIntent(userId, intention)
const result = await generateResponse(messages, systemContext)
```

El resto del archivo maneja: autenticación, rate limiting, parsing del body, y error handling.

## Beneficios

1. **Testabilidad**: Cada módulo se puede testear independientemente
2. **Mantenibilidad**: Cambios en clasificación no afectan ejecución
3. **Extensibilidad**: Agregar nuevas intenciones = agregar un case en executor
4. **Legibilidad**: El route muestra el flujo de alto nivel
