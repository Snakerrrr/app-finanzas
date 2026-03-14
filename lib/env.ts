import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  LOG_LEVEL: z.string().optional().default("info"),
})

function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten().fieldErrors)
    throw new Error("Invalid environment variables. Check server logs for details.")
  }
  return result.data
}

export const env = validateEnv()
