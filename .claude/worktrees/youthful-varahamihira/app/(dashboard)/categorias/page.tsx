"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useData } from "@/lib/data-context"
import { deleteCategoria, deleteCuenta } from "@/app/actions/finance"
import { Building2, Wallet, Plus, Pencil, Trash2 } from "lucide-react"
import { CategoriaDialog } from "@/components/categoria-dialog"
import { CuentaDialog } from "@/components/cuenta-dialog"
import type { Categoria, Cuenta } from "@/lib/types"
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
import { useToast } from "@/hooks/use-toast"

export default function CategoriasPage() {
  const { categorias, cuentas, refreshData } = useData()
  const { toast } = useToast()
  const router = useRouter()

  // Estados para Categorías
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [catDialogMode, setCatDialogMode] = useState<"create" | "edit">("create")
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | undefined>()
  const [catDeleteDialogOpen, setCatDeleteDialogOpen] = useState(false)
  const [categoriaToDelete, setCategoriaToDelete] = useState<string | null>(null)

  // Estados para Cuentas
  const [ctaDialogOpen, setCtaDialogOpen] = useState(false)
  const [ctaDialogMode, setCtaDialogMode] = useState<"create" | "edit">("create")
  const [selectedCuenta, setSelectedCuenta] = useState<Cuenta | undefined>()
  const [ctaDeleteDialogOpen, setCtaDeleteDialogOpen] = useState(false)
  const [cuentaToDelete, setCuentaToDelete] = useState<string | null>(null)

  // Handlers para Categorías
  const handleAddCategoria = () => {
    setCatDialogMode("create")
    setSelectedCategoria(undefined)
    setCatDialogOpen(true)
  }

  const handleEditCategoria = (categoria: Categoria) => {
    setCatDialogMode("edit")
    setSelectedCategoria(categoria)
    setCatDialogOpen(true)
  }

  const handleDeleteCategoriaClick = (id: string) => {
    setCategoriaToDelete(id)
    setCatDeleteDialogOpen(true)
  }

  const handleDeleteCategoriaConfirm = async () => {
    if (!categoriaToDelete) {
      setCatDeleteDialogOpen(false)
      return
    }
    const result = await deleteCategoria(categoriaToDelete)
    setCatDeleteDialogOpen(false)
    setCategoriaToDelete(null)
    if (result.success) {
      await refreshData()
      router.refresh()
      toast({
        title: "Categoría eliminada",
        description: "La categoría se ha eliminado correctamente",
      })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  // Handlers para Cuentas
  const handleAddCuenta = () => {
    setCtaDialogMode("create")
    setSelectedCuenta(undefined)
    setCtaDialogOpen(true)
  }

  const handleEditCuenta = (cuenta: Cuenta) => {
    setCtaDialogMode("edit")
    setSelectedCuenta(cuenta)
    setCtaDialogOpen(true)
  }

  const handleDeleteCuentaClick = (id: string) => {
    setCuentaToDelete(id)
    setCtaDeleteDialogOpen(true)
  }

  const handleDeleteCuentaConfirm = async () => {
    if (!cuentaToDelete) {
      setCtaDeleteDialogOpen(false)
      return
    }
    const result = await deleteCuenta(cuentaToDelete)
    setCtaDeleteDialogOpen(false)
    setCuentaToDelete(null)
    if (result.success) {
      await refreshData()
      router.refresh()
      toast({
        title: "Cuenta eliminada",
        description: "La cuenta se ha eliminado correctamente",
      })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categorías & Cuentas</h1>
        <p className="text-muted-foreground">Gestiona las categorías de gastos/ingresos y tus cuentas bancarias</p>
      </div>

      {/* Categorías */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categorías</CardTitle>
              <CardDescription>{categorias.length} categorías disponibles</CardDescription>
            </div>
            <Button onClick={handleAddCategoria}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full" style={{ backgroundColor: cat.color }} />
                  <div>
                    <p className="font-medium">{cat.nombre}</p>
                    <p className="text-xs text-muted-foreground">{cat.tipo}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEditCategoria(cat)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCategoriaClick(cat.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cuentas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Cuentas Bancarias
              </CardTitle>
              <CardDescription>{cuentas.filter((c) => c.activo).length} cuentas activas</CardDescription>
            </div>
            <Button onClick={handleAddCuenta}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cuenta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cuentas.map((cuenta) => (
              <div key={cuenta.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{cuenta.nombre}</p>
                    <p className="text-sm text-muted-foreground">{cuenta.banco}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={cuenta.activo ? "default" : "secondary"}>
                    {cuenta.activo ? "Activa" : "Inactiva"}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleEditCuenta(cuenta)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCuentaClick(cuenta.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs para Categorías */}
      <CategoriaDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        categoria={selectedCategoria}
        mode={catDialogMode}
      />

      <AlertDialog open={catDeleteDialogOpen} onOpenChange={setCatDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La categoría será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategoriaConfirm}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogs para Cuentas */}
      <CuentaDialog open={ctaDialogOpen} onOpenChange={setCtaDialogOpen} cuenta={selectedCuenta} mode={ctaDialogMode} />

      <AlertDialog open={ctaDeleteDialogOpen} onOpenChange={setCtaDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cuenta será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCuentaConfirm}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
