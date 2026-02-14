"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import * as familyService from "@/lib/services/family.service"

export async function getUserGroups() {
  const session = await auth()
  if (!session?.user?.id) return []
  return familyService.getUserGroups(session.user.id)
}

export async function createFamilyGroup(nombre: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autenticado" }
  try {
    const group = await familyService.createFamilyGroup(session.user.id, nombre)
    revalidatePath("/familia")
    return { success: true, group }
  } catch {
    return { success: false, error: "Error al crear grupo" }
  }
}

export async function joinFamilyGroup(codigo: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autenticado" }
  const result = await familyService.joinFamilyGroup(session.user.id, codigo)
  if (result.success) revalidatePath("/familia")
  return result
}

export async function deleteFamilyGroup(groupId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autenticado" }
  const result = await familyService.deleteFamilyGroup(session.user.id, groupId)
  if (result.success) revalidatePath("/familia")
  return result
}

export async function leaveFamilyGroup(groupId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autenticado" }
  const result = await familyService.leaveFamilyGroup(session.user.id, groupId)
  if (result.success) revalidatePath("/familia")
  return result
}
