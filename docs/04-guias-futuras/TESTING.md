# Testing Automatizado (Vitest)

## Setup

### Dependencias instaladas

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @vitest/ui @vitest/coverage-v8
```

### Configuración

| Archivo | Propósito |
|---------|-----------|
| `vitest.config.ts` | Configuración principal: environment node, alias `@`, coverage v8 |
| `vitest.setup.ts` | Mocks globales: Next.js cache, auth, Prisma, rate-limit, logger |

### Scripts disponibles

```bash
npm run test          # Ejecutar tests (modo watch)
npm run test:ui       # Vitest UI (interfaz visual)
npm run test:coverage # Reporte de cobertura
```

## Estructura de tests

```
tests/
├── unit/
│   └── chat-router.test.ts      # Type guards y extracción de mensajes
├── integration/
│   └── chat-executor.test.ts    # Finance service con mocks de Prisma
└── e2e/
    └── chat-flow.test.ts        # Flujo completo de conversación
```

## Tests implementados

### Unit: `chat-router.test.ts` (16 tests)

- **isUIMessage**: Valida UIMessage, rechaza legacy, rechaza primitivos
- **isLegacyMessage**: String content, array content, rechaza UIMessage sin content
- **isUIMessageArray**: Array válido, no-array, elementos inválidos
- **extractMessageContent**: UIMessage parts, legacy string, legacy array, inválidos
- **getLastUserMessage**: Último usuario, sin usuarios, no-array

### Integration: `chat-executor.test.ts` (3 tests)

- `getDashboardData` retorna balance correcto
- `getDashboardData` filtra movimientos del mes
- `getMovimientos` retorna datos filtrados

### E2E: `chat-flow.test.ts` (2 tests)

- Flujo completo: validación → extracción → clasificación
- Formatos mixtos: UIMessage + Legacy en misma conversación

## Cobertura objetivo

- **Meta**: >70% en código crítico (`lib/`, `app/api/`)
- **Provider**: v8
- **Reportes**: text (consola) + html (`coverage/`)
