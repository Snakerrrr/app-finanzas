"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Users, Plus, UserPlus, Copy, Trash2, LogOut, Crown } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  createFamilyGroup,
  joinFamilyGroup,
  deleteFamilyGroup,
  leaveFamilyGroup,
} from "@/app/actions/family"
import type { FamilyGroupForClient } from "@/lib/services/family.service"

interface FamiliaClientProps {
  initialGroups: FamilyGroupForClient[]
}

export function FamiliaClient({ initialGroups }: FamiliaClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [groups, setGroups] = useState(initialGroups)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState("")
  const [joinCode, setJoinCode] = useState("")

  const handleCreate = async () => {
    if (!newGroupName.trim()) return
    const result = await createFamilyGroup(newGroupName.trim())
    if (result.success && result.group) {
      setGroups((prev) => [result.group!, ...prev])
      setCreateOpen(false)
      setNewGroupName("")
      toast({ title: "Grupo creado", description: `Se creó el grupo "${result.group.nombre}"` })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    const result = await joinFamilyGroup(joinCode.trim().toUpperCase())
    if (result.success && result.group) {
      setGroups((prev) => [result.group!, ...prev])
      setJoinOpen(false)
      setJoinCode("")
      toast({ title: "Te uniste al grupo", description: `Ahora eres miembro de "${result.group.nombre}"` })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const result = await deleteFamilyGroup(deleteId)
    if (result.success) {
      setGroups((prev) => prev.filter((g) => g.id !== deleteId))
      toast({ title: "Grupo eliminado" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setDeleteId(null)
  }

  const handleLeave = async (groupId: string) => {
    const result = await leaveFamilyGroup(groupId)
    if (result.success) {
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
      toast({ title: "Saliste del grupo" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: "Código copiado", description: code })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grupos Familiares</h1>
          <p className="text-muted-foreground">Comparte y gestiona finanzas en grupo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setJoinOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Unirse
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Crear Grupo
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin grupos familiares"
          description="Crea un grupo para compartir y gestionar finanzas con tu familia o amigos."
          actionLabel="Crear Grupo"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {group.nombre}
                  </CardTitle>
                  <Badge variant="outline" className="gap-1 font-mono text-xs">
                    {group.codigoInvitacion}
                    <button onClick={() => copyCode(group.codigoInvitacion)}>
                      <Copy className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
                <CardDescription>{group.miembros.length} miembro(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Miembros */}
                <div className="space-y-2">
                  {group.miembros.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                          {(m.userName ?? m.userEmail ?? "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.userName ?? m.userEmail}</p>
                          <p className="text-xs text-muted-foreground">{m.userEmail}</p>
                        </div>
                      </div>
                      {m.rol === "owner" && (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Acciones */}
                <div className="flex justify-end gap-2 pt-2">
                  {group.miembros.some((m) => m.rol === "owner") ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(group.id)}
                      className="gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Eliminar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLeave(group.id)}
                      className="gap-1"
                    >
                      <LogOut className="h-3 w-3" />
                      Salir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Grupo Familiar</DialogTitle>
            <DialogDescription>
              Crea un grupo y comparte el código de invitación con los miembros.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nombre del grupo (ej: Familia García)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!newGroupName.trim()}>Crear</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Unirse */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unirse a un Grupo</DialogTitle>
            <DialogDescription>
              Ingresa el código de invitación de 6 caracteres que te compartieron.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Código (ej: ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest"
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setJoinOpen(false)}>Cancelar</Button>
              <Button onClick={handleJoin} disabled={joinCode.length < 6}>Unirse</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Eliminar */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el grupo y todos sus miembros. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
