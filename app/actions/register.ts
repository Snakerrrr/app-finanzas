"use server"

import { z } from "zod"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/db"

const registerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(120, "Nombre demasiado largo"),
  email: z.string().email("Email no válido").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100, "Contraseña demasiado larga"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

export type RegisterState =
  | { success: true }
  | { success: false; error: string }

export async function registerUser(_prevState: unknown, formData: FormData): Promise<RegisterState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const message = first.name?.[0] ?? first.email?.[0] ?? first.password?.[0] ?? first.confirmPassword?.[0] ?? "Datos inválidos"
    return { success: false, error: message }
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({
    where: { email },
  })
  if (existing) {
    return { success: false, error: "Este email ya está registrado" }
  }

  const hashedPassword = await hash(password, 12)
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  })

  return { success: true }
}
