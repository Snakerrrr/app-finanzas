/**
 * Servicio de Grupos Familiares
 * CRUD de grupos, invitaciones y miembros
 */

import { prisma } from "@/lib/db"

export type FamilyGroupForClient = {
  id: string
  nombre: string
  codigoInvitacion: string
  propietarioId: string
  miembros: FamilyMemberForClient[]
  createdAt: string
}

export type FamilyMemberForClient = {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  rol: string
  unidoEn: string
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

export async function getUserGroups(userId: string): Promise<FamilyGroupForClient[]> {
  // Grupos donde es propietario o miembro
  const memberships = await prisma.familyGroupMember.findMany({
    where: { userId },
    select: { grupoId: true },
  })

  const groupIds = memberships.map((m) => m.grupoId)

  const groups = await prisma.familyGroup.findMany({
    where: {
      OR: [
        { propietarioId: userId },
        { id: { in: groupIds } },
      ],
    },
    include: {
      miembros: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return groups.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    codigoInvitacion: g.codigoInvitacion,
    propietarioId: g.propietarioId,
    miembros: g.miembros.map((m) => ({
      id: m.id,
      userId: m.userId,
      userName: m.user.name,
      userEmail: m.user.email,
      rol: m.rol,
      unidoEn: m.unidoEn.toISOString(),
    })),
    createdAt: g.createdAt.toISOString(),
  }))
}

// ---------------------------------------------------------------------------
// Crear grupo
// ---------------------------------------------------------------------------

export async function createFamilyGroup(
  userId: string,
  nombre: string
): Promise<FamilyGroupForClient> {
  // Generar código de invitación de 6 caracteres
  const codigo = Math.random().toString(36).substring(2, 8).toUpperCase()

  const group = await prisma.familyGroup.create({
    data: {
      nombre,
      codigoInvitacion: codigo,
      propietarioId: userId,
      miembros: {
        create: {
          userId,
          rol: "owner",
        },
      },
    },
    include: {
      miembros: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  })

  return {
    id: group.id,
    nombre: group.nombre,
    codigoInvitacion: group.codigoInvitacion,
    propietarioId: group.propietarioId,
    miembros: group.miembros.map((m) => ({
      id: m.id,
      userId: m.userId,
      userName: m.user.name,
      userEmail: m.user.email,
      rol: m.rol,
      unidoEn: m.unidoEn.toISOString(),
    })),
    createdAt: group.createdAt.toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Unirse a grupo por código
// ---------------------------------------------------------------------------

export async function joinFamilyGroup(
  userId: string,
  codigoInvitacion: string
): Promise<{ success: boolean; error?: string; group?: FamilyGroupForClient }> {
  const group = await prisma.familyGroup.findUnique({
    where: { codigoInvitacion },
    include: {
      miembros: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  })

  if (!group) {
    return { success: false, error: "Código de invitación inválido" }
  }

  // Verificar si ya es miembro
  const existing = group.miembros.find((m) => m.userId === userId)
  if (existing) {
    return { success: false, error: "Ya eres miembro de este grupo" }
  }

  await prisma.familyGroupMember.create({
    data: {
      grupoId: group.id,
      userId,
      rol: "member",
    },
  })

  // Refetch para obtener datos actualizados
  const updated = await prisma.familyGroup.findUnique({
    where: { id: group.id },
    include: {
      miembros: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  })

  return {
    success: true,
    group: updated
      ? {
          id: updated.id,
          nombre: updated.nombre,
          codigoInvitacion: updated.codigoInvitacion,
          propietarioId: updated.propietarioId,
          miembros: updated.miembros.map((m) => ({
            id: m.id,
            userId: m.userId,
            userName: m.user.name,
            userEmail: m.user.email,
            rol: m.rol,
            unidoEn: m.unidoEn.toISOString(),
          })),
          createdAt: updated.createdAt.toISOString(),
        }
      : undefined,
  }
}

// ---------------------------------------------------------------------------
// Eliminar grupo (solo propietario)
// ---------------------------------------------------------------------------

export async function deleteFamilyGroup(userId: string, groupId: string): Promise<{ success: boolean; error?: string }> {
  const group = await prisma.familyGroup.findUnique({ where: { id: groupId } })
  if (!group) return { success: false, error: "Grupo no encontrado" }
  if (group.propietarioId !== userId) return { success: false, error: "Solo el propietario puede eliminar el grupo" }

  await prisma.familyGroup.delete({ where: { id: groupId } })
  return { success: true }
}

// ---------------------------------------------------------------------------
// Salir de grupo
// ---------------------------------------------------------------------------

export async function leaveFamilyGroup(userId: string, groupId: string): Promise<{ success: boolean; error?: string }> {
  const group = await prisma.familyGroup.findUnique({ where: { id: groupId } })
  if (!group) return { success: false, error: "Grupo no encontrado" }
  if (group.propietarioId === userId) return { success: false, error: "El propietario no puede salir del grupo. Elimínalo en su lugar." }

  await prisma.familyGroupMember.deleteMany({
    where: { grupoId: groupId, userId },
  })
  return { success: true }
}
