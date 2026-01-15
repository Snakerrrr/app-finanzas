'use client'

import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { Search, Send, Brain, AlertCircle, Calculator, List, Hash, PieChart as PieChartIcon, BarChart3, DollarSign, Calendar, TrendingUp, Sparkles, X, RotateCcw, CheckCircle2, Undo2, Plus, ShoppingCart, Bus, Fuel, Home, Zap, Wifi, Heart, Pill, Tv, UtensilsCrossed, Sparkles as SparklesIcon, Shirt, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLocalBrain } from '@/hooks/use-local-brain'
import { executeDatabaseQuery, type QueryResult } from '@/lib/query-executor'
import type { Transaction } from '@/lib/db'
import { useData } from '@/lib/data-context'
import { transactionToMovimiento, db } from '@/lib/db'
import type { Movimiento } from '@/lib/types'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TransactionReviewCard, type TransactionDraft } from '@/components/transaction-review-card'
import { useToast } from '@/hooks/use-toast'

export function SmartSearch() {
  const { categorias, addMovimiento, deleteMovimiento } = useData()
  const { isLoading, isReady, progress, error, askDatabase, retryInitialization } = useLocalBrain()
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<Transaction[]>([])
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [transactionDraft, setTransactionDraft] = useState<TransactionDraft | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const performSearch = async (searchQuery?: string) => {
    const queryToUse = searchQuery || query
    if (!queryToUse.trim() || isSearching || !isReady) return

    setIsSearching(true)
    setResults([])
    setMessage(null)
    setSearchError(null)
    setTransactionDraft(null) // Limpiar draft anterior

    try {
      // Extraer nombres de categorías para el prompt
      const categoriaNombres = categorias.map(cat => cat.nombre)
      
      // Consultar al modelo LLM (pasar categorías para mapeo dinámico)
      const dbQuery = await askDatabase(queryToUse, categoriaNombres)
      
      // Si es una creación, NO ejecutar todavía, sino preparar el draft
      if (dbQuery.intent === 'create_transaction' && dbQuery.createData) {
        // Mapear nombre de categoría a ID si tenemos categorías del usuario
        let categoryId: string = dbQuery.createData.category
        
        if (categorias && categorias.length > 0) {
          const categoryLower = dbQuery.createData.category.toLowerCase()
          const matchingCategoria = categorias.find(c => 
            c.nombre.toLowerCase().includes(categoryLower) ||
            categoryLower.includes(c.nombre.toLowerCase())
          )
          if (matchingCategoria) {
            categoryId = matchingCategoria.id
          } else {
            // Si no encuentra coincidencia, usar la primera categoría disponible
            const defaultCategory = categorias.find(c => 
              c.nombre.toLowerCase() === 'otros' || 
              c.nombre.toLowerCase() === 'otro' ||
              c.nombre.toLowerCase() === 'general'
            )
            categoryId = defaultCategory?.id || categorias[0].id
          }
        }

        // Crear el draft con los datos de la IA
        const draft: TransactionDraft = {
          amount: dbQuery.createData.amount,
          category: categoryId,
          description: dbQuery.createData.description,
          type: dbQuery.createData.type,
          date: dbQuery.createData.date
        }
        
        setTransactionDraft(draft)
        setMessage('Revisa y confirma los datos de la transacción antes de guardarla.')
      } else {
        // Para otras consultas, ejecutar normalmente
        const result = await executeDatabaseQuery(dbQuery, categorias)
        setQueryResult(result)
        setResults(result.transactions)
        setMessage(result.message)
      }
    } catch (error) {
      console.error('Error en la búsqueda:', error)
      setSearchError(error instanceof Error ? error.message : 'Ocurrió un error al procesar tu búsqueda')
      setQueryResult(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = () => performSearch()

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  // Función para limpiar solo el input
  const handleClearInput = useCallback(() => {
    setQuery('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Función para resetear completamente (Nueva Búsqueda)
  const handleResetSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setQueryResult(null)
    setMessage(null)
    setSearchError(null)
    setTransactionDraft(null)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Función para guardar la transacción desde el draft
  const handleSaveTransaction = async (draft: TransactionDraft) => {
    try {
      // Crear la transacción en formato Transaction (para Dexie)
      const transaction: Transaction = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount: draft.amount,
        category: draft.category,
        date: draft.date,
        type: draft.type,
        description: draft.description
      }

      // Guardar en Dexie
      await db.transactions.add(transaction)
      
      // Convertir a Movimiento y agregar al DataContext
      const movimiento = transactionToMovimiento(transaction)
      const newMovimiento: Movimiento = {
        ...movimiento,
        id: transaction.id
      }
      addMovimiento(movimiento)

      // Mostrar toast de éxito
      toast({
        title: '✅ Transacción guardada',
        description: `${draft.type === 'expense' ? 'Gasto' : 'Ingreso'} de ${formatCurrency(draft.amount)} registrado con éxito.`,
      })

      // Limpiar el draft y resetear
      setTransactionDraft(null)
      setMessage(null)
      setQuery('')
      
      if (inputRef.current) {
        inputRef.current.focus()
      }
    } catch (error) {
      console.error('Error al guardar transacción:', error)
      toast({
        title: 'Error al guardar',
        description: 'No se pudo guardar la transacción. Intenta nuevamente.',
        variant: 'destructive',
      })
    }
  }

  // Función para cancelar el draft
  const handleCancelTransaction = () => {
    setTransactionDraft(null)
    setMessage(null)
    setQuery('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Manejar tecla ESC para limpiar/resetear
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Si hay resultados, resetear completamente
        if (queryResult || results.length > 0) {
          handleResetSearch()
        } 
        // Si solo hay texto en el input, limpiarlo
        else if (query.trim()) {
          handleClearInput()
        }
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [queryResult, results.length, query, handleResetSearch, handleClearInput])

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

  // Paleta de colores para gráficos (bonita y accesible)
  const CHART_COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316', // orange-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
    '#a855f7', // purple-500
  ]

  // Formatear fecha para gráficos
  const formatDateForChart = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })
  }

  // Mapeo de iconos para categorías
  const getCategoryIcon = (icono: string) => {
    const iconMap: Record<string, any> = {
      'DollarSign': DollarSign,
      'TrendingUp': TrendingUp,
      'Home': Home,
      'ShoppingCart': ShoppingCart,
      'Bus': Bus,
      'Fuel': Fuel,
      'Zap': Zap,
      'Wifi': Wifi,
      'Heart': Heart,
      'Pill': Pill,
      'Tv': Tv,
      'UtensilsCrossed': UtensilsCrossed,
      'GraduationCap': List,
      'Sparkles': SparklesIcon,
      'Shirt': Shirt,
      'Settings': Settings,
    }
    return iconMap[icono] || ShoppingCart
  }

  // Lugares/comercios comunes por categoría
  const getCommonPlaces = (categoryName: string): string[] => {
    const placesMap: Record<string, string[]> = {
      'Supermercado': ['Jumbo', 'Líder', 'Tottus', 'Unimarc', 'Santa Isabel'],
      'Transporte': ['Uber', 'Taxi', 'Metro', 'Micro', 'Bip'],
      'Bencina': ['Copec', 'Shell', 'Esso', 'Petrobras', 'Terpel'],
      'Delivery/Restaurantes': ['Pedidos Ya', 'Uber Eats', 'Rappi', 'Restaurante', 'Café'],
      'Farmacia': ['Cruz Verde', 'Salcobrand', 'Ahumada', 'Farmacias'],
      'Servicios Básicos': ['Enel', 'Aguas Andinas', 'Gasco', 'Metrogas'],
      'Internet/Telefonía': ['VTR', 'Movistar', 'Entel', 'Claro', 'WOM'],
      'Suscripciones': ['Netflix', 'Spotify', 'Disney+', 'Amazon Prime'],
      'Entretenimiento': ['Cine', 'Teatro', 'Concierto', 'Evento'],
      'Salud': ['Isapre', 'Fonasa', 'Clínica', 'Doctor'],
      'Arriendo/Dividendo': ['Arriendo', 'Dividendo', 'Condominio'],
      'Sueldo': ['Sueldo', 'Pago'],
      'Ingresos Extra': ['Freelance', 'Venta', 'Extra'],
    }
    return placesMap[categoryName] || [categoryName]
  }

  // Generar sugerencias dinámicas basadas en la fecha actual
  const suggestions = useMemo(() => {
    const now = new Date()
    const currentMonth = now.toLocaleDateString('es-CL', { month: 'long' })
    const currentYear = now.getFullYear()
    
    // Mes pasado
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthName = lastMonth.toLocaleDateString('es-CL', { month: 'long' })
    
    // Semana pasada
    const lastWeek = new Date(now)
    lastWeek.setDate(now.getDate() - 7)
    
    // Ayer
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const yesterdayStr = yesterday.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })

    // Montos comunes para sugerencias de creación
    const commonAmounts = [5000, 10000, 15000, 20000, 30000, 50000, 100000, 150000, 200000]

    // Generar sugerencias de creación dinámicas basadas en categorías
    const createSuggestions: Array<{
      label: string
      query: string
      icon: any
      intent: 'create_transaction'
    }> = []

    // Obtener categorías de gastos más comunes
    const expenseCategories = categorias.filter(cat => 
      cat.tipo === 'Gasto' || cat.tipo === 'Ambos'
    ).slice(0, 8) // Limitar a 8 categorías para no saturar

    expenseCategories.forEach((categoria, index) => {
      const places = getCommonPlaces(categoria.nombre)
      const place = places[index % places.length] // Rotar entre lugares
      // Usar índice para seleccionar monto de forma determinística pero variada
      const amountIndex = index % commonAmounts.length
      const amount = commonAmounts[amountIndex]
      
      // Formato: "Gasté {monto} en {lugar}"
      createSuggestions.push({
        label: `${amount.toLocaleString('es-CL')} en ${place}`,
        query: `Gasté ${amount} en ${place.toLowerCase()}`,
        icon: getCategoryIcon(categoria.icono),
        intent: 'create_transaction'
      })
    })

    // Agregar algunas sugerencias de ingresos
    const incomeCategories = categorias.filter(cat => 
      cat.tipo === 'Ingreso' || cat.tipo === 'Ambos'
    ).slice(0, 3)

    incomeCategories.forEach((categoria, index) => {
      // Ingresos suelen ser mayores, usar montos más altos
      const amountIndex = (index + 3) % commonAmounts.length
      const amount = commonAmounts[amountIndex] * 5 // Multiplicar por 5 para ingresos
      createSuggestions.push({
        label: `Cobré ${amount.toLocaleString('es-CL')} - ${categoria.nombre}`,
        query: `Cobré ${amount} de ${categoria.nombre.toLowerCase()}`,
        icon: getCategoryIcon(categoria.icono),
        intent: 'create_transaction'
      })
    })

    // Agrupar por intención (aunque visualmente se muestren juntas)
    return {
      crear: createSuggestions.slice(0, 6), // Limitar a 6 sugerencias de creación
      resumen: [
        {
          label: '💰 Balance Actual',
          query: 'ver saldo',
          icon: DollarSign,
          intent: 'get_balance'
        },
        {
          label: `📊 Total Gastos ${currentMonth}`,
          query: `cuánto gasté este mes de ${currentMonth} ${currentYear}`,
          icon: Calculator,
          intent: 'sum_total'
        },
        {
          label: '📈 Resumen Financiero',
          query: 'mostrar resumen de ingresos y gastos',
          icon: TrendingUp,
          intent: 'get_summary'
        }
      ],
      especificas: [
        {
          label: '🍔 Gastos en Comida',
          query: 'gastos en comida esta semana',
          icon: Search,
          intent: 'filter_transactions'
        },
        {
          label: '🚗 Transporte del Mes',
          query: `gastos en transporte este mes de ${currentMonth}`,
          icon: Calendar,
          intent: 'filter_transactions'
        },
        {
          label: `📅 Gastos de ${lastMonthName}`,
          query: `gastos del mes pasado de ${lastMonthName}`,
          icon: Calendar,
          intent: 'filter_transactions'
        },
        {
          label: '💵 Ver Todos los Gastos',
          query: 'ver todos los gastos',
          icon: List,
          intent: 'filter_transactions'
        },
        {
          label: '💸 Ver Todos los Ingresos',
          query: 'ver todos los ingresos',
          icon: List,
          intent: 'filter_transactions'
        }
      ],
      analisis: [
        {
          label: '📊 Distribución por Categoría',
          query: 'distribución de gastos por categoría este mes',
          icon: PieChartIcon,
          intent: 'filter_transactions'
        },
        {
          label: '📈 Evolución de Gastos',
          query: 'evolución de gastos este mes',
          icon: BarChart3,
          intent: 'filter_transactions'
        },
        {
          label: `📉 Gastos de Ayer (${yesterdayStr})`,
          query: `gastos de ayer ${yesterdayStr}`,
          icon: Calendar,
          intent: 'filter_transactions'
        },
        {
          label: '🔢 Cantidad de Transacciones',
          query: 'cuántas transacciones tengo',
          icon: Hash,
          intent: 'count'
        }
      ]
    }
  }, [categorias])

  // Mantener las sugerencias organizadas por categorías (no aplanar)
  // Se usarán directamente las categorías: resumen, especificas, analisis

  // Manejar click en sugerencia
  const handleSuggestionClick = (suggestionQuery: string) => {
    setQuery(suggestionQuery)
    // Solo llenar el input, NO ejecutar búsqueda automáticamente
    // El usuario debe hacer clic en el botón de buscar
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        // Opcional: mover el cursor al final del texto
        inputRef.current.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length
        )
      }
    }, 10)
  }

  // Determinar si mostrar sugerencias
  const shouldShowSuggestions = useMemo(() => {
    // Mostrar solo cuando:
    // 1. El modelo está listo
    // 2. No hay resultados o el input está vacío
    // 3. No hay error de búsqueda activo
    return isReady && 
           !isLoading && 
           !error && 
           (results.length === 0 || !query.trim()) && 
           !isSearching &&
           !queryResult
  }, [isReady, isLoading, error, results.length, query, isSearching, queryResult])

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
              <AlertDescription className="space-y-3">
                <div>
                  <strong>Error al cargar el modelo:</strong> {error}
                </div>
                <div className="text-xs space-y-1">
                  <p><strong>Posibles soluciones:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Cierra otras pestañas que usen WebGPU o aplicaciones que consuman mucha memoria</li>
                    <li>Recarga la página (F5)</li>
                    <li>Asegúrate de tener WebGPU habilitado (Chrome/Edge recomendado)</li>
                    <li>Si el problema persiste, tu GPU puede no tener suficiente memoria para este modelo</li>
                  </ul>
                </div>
                <Button
                  onClick={retryInitialization}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner className="size-4 mr-2" />
                      Reintentando...
                    </>
                  ) : (
                    'Reintentar Carga'
                  )}
                </Button>
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
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ej: ver gastos, ingresos de esta semana, gastos en comida, ver saldo..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSearching || !isReady || isLoading}
                className="flex-1 pr-10"
              />
              {/* Botón de limpieza (X) - Solo visible cuando hay texto */}
              {query.trim() && !isSearching && (
                <button
                  type="button"
                  onClick={handleClearInput}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="size-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
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

          {/* Consultas Sugeridas */}
          {shouldShowSuggestions && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="size-4 text-primary" />
                <span>Consultas sugeridas</span>
              </div>

              {/* Sección: Resumen y Totales */}
              {suggestions.resumen.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Resumen y Totales
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.resumen.map((suggestion, index) => {
                      const Icon = suggestion.icon
                      return (
                        <button
                          key={`resumen-${index}`}
                          onClick={() => handleSuggestionClick(suggestion.query)}
                          disabled={isSearching || !isReady}
                          className={`
                            inline-flex items-center gap-2 px-4 py-2.5 
                            rounded-lg text-sm font-medium
                            bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40
                            border border-blue-200 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-800/50
                            transition-all duration-200
                            cursor-pointer
                            disabled:opacity-50 disabled:cursor-not-allowed
                            focus:outline-none focus:ring-2 focus:ring-blue-500/20
                            active:scale-95
                            shadow-sm hover:shadow
                          `}
                        >
                          <Icon className="size-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-blue-900 dark:text-blue-100">{suggestion.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sección: Consultas Específicas */}
              {suggestions.especificas.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Consultas Específicas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.especificas.map((suggestion, index) => {
                      const Icon = suggestion.icon
                      return (
                        <button
                          key={`especificas-${index}`}
                          onClick={() => handleSuggestionClick(suggestion.query)}
                          disabled={isSearching || !isReady}
                          className={`
                            inline-flex items-center gap-2 px-4 py-2.5 
                            rounded-lg text-sm font-medium
                            bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40
                            border border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-800/50
                            transition-all duration-200
                            cursor-pointer
                            disabled:opacity-50 disabled:cursor-not-allowed
                            focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                            active:scale-95
                            shadow-sm hover:shadow
                          `}
                        >
                          <Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-900 dark:text-emerald-100">{suggestion.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sección: Análisis y Gráficos */}
              {suggestions.analisis.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Análisis y Gráficos
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.analisis.map((suggestion, index) => {
                      const Icon = suggestion.icon
                      return (
                        <button
                          key={`analisis-${index}`}
                          onClick={() => handleSuggestionClick(suggestion.query)}
                          disabled={isSearching || !isReady}
                          className={`
                            inline-flex items-center gap-2 px-4 py-2.5 
                            rounded-lg text-sm font-medium
                            bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/40
                            border border-purple-200 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-800/50
                            transition-all duration-200
                            cursor-pointer
                            disabled:opacity-50 disabled:cursor-not-allowed
                            focus:outline-none focus:ring-2 focus:ring-purple-500/20
                            active:scale-95
                            shadow-sm hover:shadow
                          `}
                        >
                          <Icon className="size-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-purple-900 dark:text-purple-100">{suggestion.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sección: Crear Transacciones (Nueva) */}
              {suggestions.crear && suggestions.crear.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Plus className="size-3" />
                    Crear Transacciones
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.crear.map((suggestion, index) => {
                      const Icon = suggestion.icon
                      return (
                        <button
                          key={`crear-${index}`}
                          onClick={() => handleSuggestionClick(suggestion.query)}
                          disabled={isSearching || !isReady}
                          className={`
                            inline-flex items-center gap-2 px-4 py-2.5 
                            rounded-lg text-sm font-medium
                            bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40
                            border border-amber-200 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-800/50
                            transition-all duration-200
                            cursor-pointer
                            disabled:opacity-50 disabled:cursor-not-allowed
                            focus:outline-none focus:ring-2 focus:ring-amber-500/20
                            active:scale-95
                            shadow-sm hover:shadow
                          `}
                        >
                          <Icon className="size-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-amber-900 dark:text-amber-100">{suggestion.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

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
          {message && !searchError && !transactionDraft && queryResult?.operation !== 'CREATE' && (
            <div className="p-3 bg-muted/50 rounded-md text-sm">
              {message}
            </div>
          )}

          {/* Mensaje cuando se detecta una transacción a crear */}
          {transactionDraft && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-md text-sm text-blue-900 dark:text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                <span>Transacción detectada. Revisa los datos en el modal.</span>
              </div>
            </div>
          )}

          {/* Modal de Revisión de Transacción (Staging Area) */}
          <TransactionReviewCard
            draft={transactionDraft}
            categorias={categorias}
            open={transactionDraft !== null}
            onSave={handleSaveTransaction}
            onCancel={handleCancelTransaction}
          />

          {/* Tarjeta de Confirmación (CREATE) */}
          {queryResult && 
           queryResult.operation === 'CREATE' && 
           queryResult.createdTransaction && 
           queryResult.status === 'success' && (
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-green-500/20 rounded-full">
                      <CheckCircle2 className="size-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {queryResult.message}
                        </span>
                      </div>
                      {queryResult.createdTransaction.description && (
                        <p className="text-xs text-muted-foreground">
                          {queryResult.createdTransaction.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(queryResult.createdTransaction.date)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (queryResult.createdTransaction) {
                        deleteMovimiento(queryResult.createdTransaction.id)
                        handleResetSearch()
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Undo2 className="size-4 mr-1" />
                    Deshacer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tarjeta de Resumen (SUM_TOTAL) - Solo si es single_value */}
          {queryResult && 
           queryResult.operation === 'SUM_TOTAL' && 
           queryResult.total !== undefined && 
           queryResult.visualization === 'single_value' && (
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calculator className="size-4" />
                      <span>Total Calculado</span>
                    </div>
                    <div className="text-4xl font-bold text-primary">
                      {formatCurrency(Math.abs(queryResult.total))}
                    </div>
                    {queryResult.total < 0 && (
                      <p className="text-sm text-muted-foreground">
                        Saldo negativo
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {results.length} {results.length === 1 ? 'transacción' : 'transacciones'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Torta (Pie Chart) */}
          {queryResult && 
           queryResult.visualization === 'pie_chart' && 
           queryResult.groupedData && 
           queryResult.groupedData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="size-5" />
                  Distribución {queryResult.groupBy === 'category' ? 'por Categoría' : 'por Fecha'}
                </CardTitle>
                <CardDescription>
                  {queryResult.message}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={queryResult.groupedData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ label, value, percent }) => 
                        `${label}: ${formatCurrency(value)} (${(percent * 100).toFixed(1)}%)`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {queryResult.groupedData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS[index % CHART_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Barras (Bar Chart) */}
          {queryResult && 
           queryResult.visualization === 'bar_chart' && 
           queryResult.groupedData && 
           queryResult.groupedData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-5" />
                  {queryResult.groupBy === 'category' ? 'Comparativa por Categoría' : 'Evolución Temporal'}
                </CardTitle>
                <CardDescription>
                  {queryResult.message}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={queryResult.groupedData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="label" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value.toLocaleString('es-CL')}`}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="value" 
                      fill={CHART_COLORS[0]}
                      radius={[8, 8, 0, 0]}
                      name="Monto"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tarjeta de Contador (COUNT) */}
          {queryResult && queryResult.operation === 'COUNT' && queryResult.count !== undefined && (
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="size-4" />
                      <span>Cantidad de Transacciones</span>
                    </div>
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                      {queryResult.count}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {queryResult.count === 1 ? 'transacción encontrada' : 'transacciones encontradas'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabla de resultados (LIST o cuando visualization es table) */}
          {queryResult && 
           (queryResult.operation === 'LIST' || queryResult.visualization === 'table') && 
           results.length > 0 && (
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
                <li>• "ver todos los gastos" (lista)</li>
                <li>• "cuánto gasté este mes" (total)</li>
                <li>• "cuántas transacciones" (contador)</li>
                <li>• "gastos en supermercado" (lista filtrada)</li>
                <li>• "total de ingresos" (suma)</li>
              </ul>
            </div>
          )}

          {/* Botón "Nueva Búsqueda" - Visible cuando hay resultados */}
          {(queryResult || results.length > 0) && !isSearching && (
            <div className="flex justify-center pt-4 border-t">
              <Button
                onClick={handleResetSearch}
                variant="outline"
                className="gap-2"
              >
                <RotateCcw className="size-4" />
                Nueva Búsqueda
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
