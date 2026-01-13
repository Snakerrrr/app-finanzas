'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { aiService } from '@/lib/ai-service'
import { mapIntentToQuery } from '@/lib/search-mapper'
import type { Transaction } from '@/lib/db'
import { useData } from '@/lib/data-context'

export function SmartSearch() {
  const { categorias } = useData()
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [results, setResults] = useState<Transaction[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(true) // Ya inicializado por data-context
  const inputRef = useRef<HTMLInputElement>(null)

  // Cargar modelo de IA al montar (pre-carga)
  useEffect(() => {
    const loadModel = async () => {
      if (!aiService.isModelLoaded()) {
        setIsModelLoading(true)
        try {
          await aiService.loadModel()
        } catch (error) {
          console.error('Error al cargar el modelo de IA:', error)
        } finally {
          setIsModelLoading(false)
        }
      }
    }

    loadModel()
  }, [])

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setResults([])
    setMessage(null)

    try {
      // Clasificar intención con IA (pasar categorías del usuario para mapeo dinámico)
      const classification = await aiService.classifyIntent(query, categorias)
      
      // Mapear intención a consulta de base de datos
      const searchResult = await mapIntentToQuery(classification)
      
      setResults(searchResult.transactions)
      setMessage(searchResult.message || null)
    } catch (error) {
      console.error('Error en la búsqueda:', error)
      setMessage('Ocurrió un error al procesar tu búsqueda. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
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
            <Search className="size-5" />
            Búsqueda Inteligente Privada
          </CardTitle>
          <CardDescription>
            Busca tus finanzas usando lenguaje natural. Todo se procesa localmente en tu navegador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado de carga del modelo */}
          {isModelLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
              <Loader2 className="size-4 animate-spin" />
              <span>Cargando modelo de IA...</span>
            </div>
          )}

          {/* Input de búsqueda */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ej: ver gastos, ver ingresos, gastos en comida, ver saldo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isModelLoading || !isInitialized}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading || isModelLoading || !isInitialized || !query.trim()}
            >
              {isLoading ? (
                <>
                  <Spinner className="size-4" />
                  <span className="sr-only">Buscando...</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span className="sr-only">Buscar</span>
                </>
              )}
            </Button>
          </div>

          {/* Mensaje de resultado */}
          {message && (
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
          {!isLoading && results.length === 0 && message && message.includes('No pude entender') && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Intenta con frases como:</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• "ver gastos"</li>
                <li>• "ver ingresos"</li>
                <li>• "ver saldo"</li>
                <li>• "gastos en comida"</li>
                <li>• "gastos en transporte"</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
