'use client'

import { useState, useRef } from 'react'
import { Search, Send, Brain, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLocalBrain } from '@/hooks/use-local-brain'
import { executeDatabaseQuery } from '@/lib/query-executor'
import type { Transaction } from '@/lib/db'
import { useData } from '@/lib/data-context'

export function SmartSearch() {
  const { categorias } = useData()
  const { isLoading, isReady, progress, error, askDatabase } = useLocalBrain()
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<Transaction[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = async () => {
    if (!query.trim() || isSearching || !isReady) return

    setIsSearching(true)
    setResults([])
    setMessage(null)
    setSearchError(null)

    try {
      // Consultar al modelo LLM
      const dbQuery = await askDatabase(query)
      
      // Ejecutar la consulta en Dexie (pasar categorías para mapeo dinámico)
      const queryResult = await executeDatabaseQuery(dbQuery, categorias)
      
      setResults(queryResult.transactions)
      setMessage(queryResult.message)
    } catch (error) {
      console.error('Error en la búsqueda:', error)
      setSearchError(error instanceof Error ? error.message : 'Ocurrió un error al procesar tu búsqueda')
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      expense: 'Gasto',
      income: 'Ingreso',
      transfer: 'Transferencia'
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      expense: 'text-red-600 dark:text-red-400',
      income: 'text-green-600 dark:text-green-400',
      transfer: 'text-blue-600 dark:text-blue-400'
    }
    return colors[type] || ''
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="size-5" />
            Búsqueda Inteligente Privada
          </CardTitle>
          <CardDescription>
            Busca tus finanzas usando lenguaje natural con IA local (Phi-3.5-mini). 
            Todo se procesa en tu navegador con WebGPU.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de progreso de carga del modelo */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progress.text}</span>
                <span className="font-medium">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                Descargando modelo Phi-3.5-mini (~1GB). Esto solo ocurre la primera vez.
              </p>
            </div>
          )}

          {/* Error de carga del modelo */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>
                Error al cargar el modelo: {error}
                <br />
                <span className="text-xs mt-1 block">
                  Asegúrate de tener WebGPU habilitado en tu navegador (Chrome/Edge recomendado)
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Estado listo */}
          {isReady && !isLoading && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
              <Brain className="size-4" />
              <span>Modelo listo. Puedes hacer consultas en lenguaje natural.</span>
            </div>
          )}

          {/* Input de búsqueda */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ej: ver gastos, ingresos de esta semana, gastos en comida, ver saldo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSearching || !isReady || isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !isReady || isLoading || !query.trim()}
            >
              {isSearching ? (
                <>
                  <Spinner className="size-4" />
                  <span className="sr-only">Analizando...</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span className="sr-only">Buscar</span>
                </>
              )}
            </Button>
          </div>

          {/* Estado de análisis */}
          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
              <Spinner className="size-4 animate-spin" />
              <span>Analizando consulta con IA...</span>
            </div>
          )}

          {/* Error de búsqueda */}
          {searchError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}

          {/* Mensaje de resultado */}
          {message && !searchError && (
            <div className="p-3 bg-muted/50 rounded-md text-sm">
              {message}
            </div>
          )}

          {/* Tabla de resultados */}
          {results.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <span className={getTypeColor(transaction.type)}>
                          {getTypeLabel(transaction.type)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transaction.category}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${getTypeColor(transaction.type)}`}>
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Estado vacío */}
          {!isSearching && results.length === 0 && message && !searchError && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No se encontraron transacciones.</p>
              <p className="text-xs mt-2">Intenta con otras consultas como:</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• "ver todos los gastos"</li>
                <li>• "ingresos de este mes"</li>
                <li>• "gastos en supermercado"</li>
                <li>• "transacciones de la semana pasada"</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
