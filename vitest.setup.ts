import { vi } from "vitest"

// Mock Next.js modules
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    $connect: vi.fn(),
    movimiento: { findMany: vi.fn() },
    cuenta: { findMany: vi.fn() },
    categoria: { findMany: vi.fn() },
  },
}))

vi.mock("@/lib/rate-limit", () => ({
  chatRateLimit: { limit: vi.fn().mockResolvedValue({ success: true, limit: 20, remaining: 19, reset: Date.now() + 60000 }) },
  ipRateLimit: { limit: vi.fn().mockResolvedValue({ success: true }) },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  logChatEvent: vi.fn(),
}))
