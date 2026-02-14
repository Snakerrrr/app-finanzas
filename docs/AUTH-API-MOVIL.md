# 📱 Autenticación API Móvil - Guía de Uso

Este documento explica cómo autenticar tu app móvil (React Native, Capacitor, Flutter, etc.) con el backend de Finanzas.

---

## 🎯 ¿Qué problema resuelve?

Las aplicaciones móviles nativas **no pueden usar cookies de sesión** como lo hace la web. Por eso, implementamos un sistema de **autenticación dual**:

- **Web**: Cookies de sesión (NextAuth.js) ✅
- **Móvil**: Bearer tokens (JWT) ✅

---

## 🔐 Flujo de Autenticación Móvil

### 1. Login (Obtener Token)

**Endpoint**: `POST /api/auth/mobile/login`

**Request Body**:
```json
{
  "email": "usuario@ejemplo.cl",
  "password": "tuContraseñaSegura"
}
```

**Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123abc...",
    "email": "usuario@ejemplo.cl",
    "name": "Juan Pérez"
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Credenciales inválidas"
}
```

**Response (400 Bad Request)** - Usuario OAuth:
```json
{
  "error": "Usuario creado con OAuth. Usa login de Google en la web."
}
```

---

### 2. Usar el Token en Requests

Una vez que tienes el token, inclúyelo en el header `Authorization` de **todos los requests** a la API:

**Header**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo con `fetch` (JavaScript)**:
```typescript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Guardado localmente

const response = await fetch("https://tu-dominio.com/api/v1/movimientos", {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
})

const data = await response.json()
console.log(data)
```

**Ejemplo con `axios` (JavaScript)**:
```typescript
import axios from "axios"

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Guardado localmente

const { data } = await axios.get("https://tu-dominio.com/api/v1/movimientos", {
  headers: {
    "Authorization": `Bearer ${token}`
  }
})

console.log(data)
```

---

## 📍 Endpoints Protegidos

Todos estos endpoints soportan autenticación dual (cookies o Bearer token):

### **Movimientos**
- `GET /api/v1/movimientos` - Lista movimientos
- `POST /api/v1/movimientos` - Crea un movimiento
- `GET /api/v1/movimientos/:id` - Obtiene un movimiento
- `PUT /api/v1/movimientos/:id` - Actualiza un movimiento
- `DELETE /api/v1/movimientos/:id` - Elimina un movimiento

### **Cuentas**
- `GET /api/v1/cuentas` - Lista cuentas
- `POST /api/v1/cuentas` - Crea una cuenta
- `GET /api/v1/cuentas/:id` - Obtiene una cuenta
- `PUT /api/v1/cuentas/:id` - Actualiza una cuenta
- `DELETE /api/v1/cuentas/:id` - Elimina una cuenta

### **Categorías**
- `GET /api/v1/categorias` - Lista categorías
- `POST /api/v1/categorias` - Crea una categoría
- `GET /api/v1/categorias/:id` - Obtiene una categoría
- `PUT /api/v1/categorias/:id` - Actualiza una categoría
- `DELETE /api/v1/categorias/:id` - Elimina una categoría

---

## 💾 Almacenamiento del Token

El token debe guardarse **de forma segura** en el dispositivo móvil:

### React Native
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'

// Guardar token
await AsyncStorage.setItem('@auth_token', token)

// Leer token
const token = await AsyncStorage.getItem('@auth_token')

// Eliminar token (logout)
await AsyncStorage.removeItem('@auth_token')
```

### Capacitor (Ionic)
```typescript
import { Preferences } from '@capacitor/preferences'

// Guardar token
await Preferences.set({ key: 'auth_token', value: token })

// Leer token
const { value } = await Preferences.get({ key: 'auth_token' })

// Eliminar token (logout)
await Preferences.remove({ key: 'auth_token' })
```

---

## ⏳ Duración del Token

- **Validez**: 7 días
- **Renovación**: Después de 7 días, el usuario debe hacer login de nuevo
- **Seguridad**: El token se firma con `AUTH_SECRET` (ver `.env`)

---

## 🚨 Manejo de Errores

### Token Expirado (401)
```json
{
  "error": "Token inválido o expirado"
}
```

**Solución**: Solicitar al usuario que haga login de nuevo.

### Sin Token (401)
```json
{
  "error": "No autenticado"
}
```

**Solución**: Redirigir al usuario a la pantalla de login.

---

## 🔧 Ejemplo Completo: React Native

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'

class AuthService {
  private baseURL = "https://tu-dominio.com/api"

  // Login y guardar token
  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/mobile/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const { error } = await response.json()
      throw new Error(error)
    }

    const { token, user } = await response.json()
    await AsyncStorage.setItem('@auth_token', token)
    return { token, user }
  }

  // Obtener token guardado
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('@auth_token')
  }

  // Logout
  async logout() {
    await AsyncStorage.removeItem('@auth_token')
  }

  // Hacer request autenticado
  async fetchAPI(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken()
    
    if (!token) {
      throw new Error("No autenticado")
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    })

    if (response.status === 401) {
      // Token expirado o inválido
      await this.logout()
      throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.")
    }

    if (!response.ok) {
      const { error } = await response.json()
      throw new Error(error)
    }

    return await response.json()
  }
}

export const authService = new AuthService()

// USO
// Login
const { token, user } = await authService.login("usuario@ejemplo.cl", "password123")

// Obtener movimientos
const { data } = await authService.fetchAPI("/v1/movimientos")

// Crear movimiento
const result = await authService.fetchAPI("/v1/movimientos", {
  method: "POST",
  body: JSON.stringify({
    fecha: "2026-02-13",
    descripcion: "Compra en supermercado",
    tipoMovimiento: "Gasto",
    categoriaId: "clx123...",
    metodoPago: "Débito",
    montoCLP: 25000,
    estadoConciliacion: "Pendiente",
    mesConciliacion: "2026-02"
  })
})

// Logout
await authService.logout()
```

---

## 🔒 Seguridad

### Consideraciones
1. **HTTPS obligatorio**: Nunca envíes el token por HTTP sin cifrar
2. **No compartas el token**: El token es único por usuario
3. **No lo expongas**: No lo incluyas en logs ni lo imprimas en consola
4. **Almacenamiento seguro**: Usa `AsyncStorage` o `Preferences`, **NO** localStorage web en WebViews

### Variables de Entorno
El token se firma con `AUTH_SECRET` que está en `.env`:

```env
AUTH_SECRET="tu-secreto-super-seguro-de-32-caracteres-minimo"
```

---

## 🧪 Testing con cURL

### Login
```bash
curl -X POST https://tu-dominio.com/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@ejemplo.cl","password":"password123"}'
```

### Request Autenticado
```bash
curl https://tu-dominio.com/api/v1/movimientos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ❓ Preguntas Frecuentes

### ¿Puedo usar OAuth (Google) desde móvil?
No directamente. Para usar Google OAuth, el usuario debe autenticarse desde la web. Después, puedes implementar un flujo donde:
1. El usuario se autentica en la web con Google OAuth
2. La web genera un "token de enlace" temporal
3. La app móvil usa ese token para obtener un JWT móvil

### ¿Qué pasa si pierdo mi token?
El usuario debe hacer login de nuevo. No hay forma de recuperar un token perdido.

### ¿Puedo tener múltiples tokens activos?
Sí, cada login genera un token independiente. Si el usuario hace login desde múltiples dispositivos, todos tendrán tokens válidos.

### ¿Cómo renuevo un token expirado?
Actualmente, los tokens duran 7 días y luego expiran. El usuario debe hacer login de nuevo. Para implementar refresh tokens, necesitas crear un endpoint adicional.

---

## 📚 Recursos

- Documentación de JWT: https://jwt.io
- NextAuth.js: https://next-auth.js.org
- React Native AsyncStorage: https://react-native-async-storage.github.io/async-storage/
- Capacitor Preferences: https://capacitorjs.com/docs/apis/preferences

---

**¿Dudas?** Revisa el código de implementación en `lib/auth-api.ts` y `app/api/auth/mobile/login/route.ts`.
