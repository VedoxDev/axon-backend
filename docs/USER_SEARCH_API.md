# Documentación de la API de Búsqueda de Usuarios 🔍

## Descripción General
Endpoint simple y rápido de búsqueda de usuarios para encontrar usuarios por nombre, email o coincidencias parciales en todo el sistema.

## Características ✨
- **Búsqueda Rápida** - Consultas eficientes de base de datos con indexación adecuada
- **Búsqueda en Múltiples Campos** - Búsqueda en nombre, apellidos, email y nombre completo
- **Insensible a Mayúsculas** - Coincidencias inteligentes sin importar mayúsculas/minúsculas
- **Coincidencias Parciales** - Encuentra usuarios con información incompleta
- **Limitación de Resultados** - Controla el tamaño del conjunto de resultados para mejorar rendimiento
- **Seguridad** - No expone datos sensibles en los resultados

---

## 🎯 Inicio Rápido

### Búsqueda Básica de Usuario
```http
GET /users/search?q=john
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "users": [
    {
      "id": "user-uuid-1",
      "nombre": "John",
      "apellidos": "Smith",
      "email": "john.smith@example.com",
      "status": "online",
      "fullName": "John Smith"
    }
  ],
  "total": 1,
  "query": "john"
}
```

---

## 📋 Detalles del Endpoint

### Buscar Usuarios
**URL:** `GET /users/search`

**Autenticación:** Requerida (Token JWT Bearer)

**Parámetros de Consulta:**
| Parámetro | Tipo | Requerido | Descripción | Por defecto | Máximo |
|-----------|------|-----------|-------------|-------------|--------|
| `q` | string | ✅ Sí | Consulta de búsqueda (mín 2 caracteres) | - | - |
| `limit` | number | ❌ No | Máximo de resultados | 10 | 50 |

**Campos de Búsqueda:**
- Nombre (`nombre`)
- Apellidos (`apellidos`) 
- Dirección de email
- Nombre completo (concatenado)

**Ejemplos de Solicitud:**
```http
GET /users/search?q=john
GET /users/search?q=smith&limit=5
GET /users/search?q=user@example.com
GET /users/search?q=john smith&limit=20
```

---

## 📊 Formatos de Respuesta

### Respuesta Exitosa (200)
```json
{
  "users": [
    {
      "id": "357b292d-ddbf-4061-89ce-2243f6d9db57",
      "nombre": "John",
      "apellidos": "Smith",
      "email": "john.smith@example.com",
      "status": "online",
      "fullName": "John Smith"
    },
    {
      "id": "8f4e2c1a-5b6d-4e3f-9a8b-7c6d5e4f3a2b",
      "nombre": "Jane",
      "apellidos": "Johnson",
      "email": "jane.johnson@company.com",
      "status": "offline",
      "fullName": "Jane Johnson"
    }
  ],
  "total": 2,
  "query": "john"
}
```

### Resultados Vacíos (200)
```json
{
  "users": [],
  "total": 0,
  "query": "usuarioinexistente"
}
```

### Consulta Muy Corta (200)
```json
{
  "users": [],
  "message": "search-query-too-short"
}
```

---

## ❌ Respuestas de Error

### 401 No Autorizado
**Token JWT faltante o inválido**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 🔍 Comportamiento de Búsqueda

### Lógica de Búsqueda
- **Insensible a Mayúsculas**: Coincide sin importar mayúsculas/minúsculas
- **Coincidencias Parciales**: Usa patrón de coincidencia `LIKE %query%`
- **Múltiples Campos**: Busca en todos los campos relevantes del usuario
- **Orden Alfabético**: Resultados ordenados por nombre, luego apellidos

### Ejemplos de Búsqueda
| Consulta | Coincidencias |
|----------|---------------|
| `john` | John Smith, Johnny Doe, john.doe@email.com |
| `smith` | John Smith, Jane Smith-Wilson |
| `user@` | user@example.com, myuser@company.com |
| `john smith` | John Smith, Smith Johnson |

### Reglas de Validación
- Longitud mínima de consulta: **2 caracteres**
- Máximo de resultados: **50 usuarios**
- La consulta se limpia automáticamente de espacios en blanco
- Se permiten caracteres especiales en la búsqueda

---

## 📋 Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | UUID único del usuario |
| `nombre` | string | Nombre del usuario |
| `apellidos` | string | Apellidos del usuario |
| `email` | string | Dirección de email del usuario |
| `status` | string | Estado actual (`online`, `offline`, `away`, `busy`) |
| `fullName` | string | Nombre completo calculado para mostrar |

---

## 🔒 Seguridad y Privacidad

### Protección de Datos
- ✅ **Sin Contraseñas**: Los campos de contraseña están completamente excluidos
- ✅ **JWT Requerido**: Todas las solicitudes deben estar autenticadas
- ✅ **Protegido contra Inyección SQL**: Se utilizan consultas parametrizadas
- ✅ **Listo para Limitación de Tasa**: Endpoint diseñado para limitación de tasa

### Control de Acceso
- Los usuarios autenticados pueden buscar a todos los demás usuarios
- No se requieren permisos especiales más allá de un JWT válido
- Los resultados incluyen usuarios de todos los proyectos/equipos

---

## 🎯 Casos de Uso Comunes

### Selección de Usuario para Invitaciones
Perfecto para menús desplegables de invitación a proyectos y selección de miembros.

### Descubrimiento de Contactos
Encuentra colegas y miembros del equipo en toda la organización.

### Funcionalidad de Autocompletado
Ideal para campos de entrada de usuario con sugerencias de búsqueda en tiempo real.

### Mensajería Directa
Encuentra usuarios para iniciar conversaciones directas.

---

## 💡 Mejores Prácticas

### Consejos de Rendimiento
- Usa valores razonables de `limit` (10-20 para menús desplegables de UI)
- Implementa debouncing del lado del cliente para búsqueda en tiempo real
- Almacena en caché las búsquedas frecuentes cuando sea apropiado

### Experiencia de Usuario
- Muestra "No se encontraron resultados" para conjuntos de resultados vacíos
- Muestra estados de carga durante las solicitudes de búsqueda
- Maneja el mensaje "búsqueda muy corta" de manera elegante

### Manejo de Errores
- Siempre verifica errores de autenticación
- Proporciona respaldo cuando la búsqueda falla
- Valida la longitud de la consulta también del lado del cliente

---

## 🚀 Ejemplos de Integración

### Implementación Básica
```javascript
// Función de búsqueda simple
const searchUsers = async (query, limit = 10) => {
  const response = await fetch(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.json();
};

// Uso
const results = await searchUsers('john');
console.log(`Se encontraron ${results.total} usuarios`);
```

### Con Manejo de Errores
```javascript
const searchUsersWithErrorHandling = async (query, limit = 10) => {
  try {
    if (query.length < 2) {
      return { users: [], message: 'Consulta muy corta' };
    }
    
    const response = await fetch(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error en la búsqueda');
    }
    
    return response.json();
    
  } catch (error) {
    console.error('Error en la búsqueda de usuarios:', error);
    return { users: [], error: error.message };
  }
};
```

### Con React Hooks
```javascript
import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';

const useUserSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery) => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const data = await searchUsers(searchQuery);
        setResults(data.users);
      } catch (error) {
        console.error('Error en la búsqueda:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );
  
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);
  
  return { query, setQuery, results, loading };
};
```

---

## 🔧 Notas de Implementación

### Optimización de Consultas
```sql
-- Índices recomendados para mejor rendimiento
CREATE INDEX idx_users_nombre ON users(nombre);
CREATE INDEX idx_users_apellidos ON users(apellidos);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_search ON users(nombre, apellidos, email);
```

### Configuración de Rate Limiting
```javascript
// Configuración recomendada de rate limiting
{
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 solicitudes por ventana por IP
  message: 'Demasiadas solicitudes de búsqueda'
}
```

**🎉 Listo para buscar y descubrir usuarios en su plataforma!** 🚀 