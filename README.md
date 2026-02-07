# Personal finance app

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/404badrequests-projects/v0-personal-finance-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/hwK9VivbRpo)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Funcionalidades

- **App de finanzas personales:** dashboard, movimientos, cuentas, categorías, presupuestos y metas.
- **API REST v1** para consumo desde app móvil: `app/api/v1/` (movimientos, cuentas, categorías). Ver `docs/API-Y-ARQUITECTURA.md`.
- **Asistente de IA (FinanzasIA):** chat flotante en la app que responde preguntas sobre balance, gastos e ingresos usando datos reales del usuario.

## Últimas actualizaciones (asistente de IA)

### Chat con Vercel AI SDK

- **Ruta:** `app/api/chat/route.ts`
  - Autenticación con NextAuth (`auth()`). Sin sesión → 401.
  - Modelo: **OpenAI** `gpt-4o-mini` (requiere `OPENAI_API_KEY` en `.env.local`).
  - Streaming con `streamText` y respuesta `toUIMessageStreamResponse()`.
  - Mensajes convertidos con `convertToModelMessages` (SDK actual).
  - Tools definidas con `inputSchema` (Zod envuelto en `zodSchema`):
    - **getBalance:** obtiene balance total, ingresos y gastos del mes (usa `getDashboardData` del servicio).
    - **getTransactions:** busca movimientos por rango de fechas (usa `getMovimientos`).
- **Cliente:** `components/ai-assistant.tsx`
  - Hook `useChat` de `@ai-sdk/react` (API con `sendMessage` y `status`).
  - Estado local del texto del input. Botón flotante y panel de chat con burbujas (Bot/User).
  - Enter sin Shift envía mensaje; formulario con `preventDefault` para evitar recarga.

### Comportamiento del asistente (system prompt)

- **Charla casual:** saludos, agradecimientos o despedidas → respuesta amable sin llamar a herramientas.
- **Consultas vagas** (“¿Cómo voy?”, “Resumen”, “¿Tengo plata?”) → se interpretan como petición de balance y se usa `getBalance`.
- **Consultas específicas** (gastos por categoría, ingresos por mes) → se usa `getTransactions` con filtros.
- Formato: negritas para montos (**$15.000 CLP**), respuestas concisas y comentarios breves si hay gastos altos.

### Configuración necesaria

1. Crear `.env.local` en la raíz del proyecto.
2. Añadir: `OPENAI_API_KEY=sk-...` (tu clave de OpenAI).
3. Reiniciar el servidor (`npm run dev`).

Si falta la clave, la API devuelve 503 con un mensaje indicando que se configure `OPENAI_API_KEY`.

## Deployment

Your project is live at:

**[https://vercel.com/404badrequests-projects/v0-personal-finance-app](https://vercel.com/404badrequests-projects/v0-personal-finance-app)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/hwK9VivbRpo](https://v0.app/chat/hwK9VivbRpo)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Documentación adicional

- **API y arquitectura (Service Layer, API v1, app móvil):** `docs/API-Y-ARQUITECTURA.md`
- **NextAuth:** `docs/NEXTAUTH-SETUP.md`
- **Prisma y Supabase:** `docs/PRISMA-SUPABASE-SETUP.md`
