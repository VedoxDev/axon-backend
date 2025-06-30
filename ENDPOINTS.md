# ENDPOINTS API - Axon Backend

Documentación completa de todos los endpoints disponibles en la aplicación Axon Backend.

## 📋 Tabla de Contenidos

- [Autenticación](#autenticación)
- [Usuarios](#usuarios)
- [Proyectos](#proyectos)
- [Tareas](#tareas)
- [Chat](#chat)
- [Llamadas](#llamadas)
- [Anuncios](#anuncios)
- [General](#general)

---

## 🔐 Autenticación

### POST `/auth/login`
**Iniciar sesión**
- **Descripción**: Autentica al usuario y devuelve un token JWT
- **Body**: `{ "email": "usuario@ejemplo.com", "password": "contraseña" }`
- **Respuesta**: `{ "access_token": "jwt_token", "user": {...} }`

### POST `/auth/register`
**Registrar nuevo usuario**
- **Descripción**: Crea una nueva cuenta de usuario
- **Body**: `{ "email": "usuario@ejemplo.com", "nombre": "Juan", "apellidos": "Pérez", "password": "contraseña" }`
- **Respuesta**: `{ "message": "User registered", "id": "uuid" }`

### GET `/auth/me`
**Obtener información del usuario actual**
- **Descripción**: Devuelve los datos básicos del usuario autenticado
- **Headers**: `Authorization: Bearer <token>`
- **Respuesta**: `{ "id": "uuid", "email": "...", "nombre": "..." }`

### GET `/auth/me/profile`
**Obtener perfil completo del usuario**
- **Descripción**: Devuelve el perfil detallado del usuario autenticado
- **Headers**: `Authorization: Bearer <token>`
- **Respuesta**: Perfil completo con proyectos, tareas, etc.

### PUT `/auth/change-password`
**Cambiar contraseña**
- **Descripción**: Permite al usuario cambiar su contraseña
- **Body**: `{ "currentPassword": "actual", "newPassword": "nueva", "confirmPassword": "nueva" }`
- **Headers**: `Authorization: Bearer <token>`

### POST `/auth/request-password-reset`
**Solicitar restablecimiento de contraseña**
- **Descripción**: Envía un email con token para restablecer contraseña
- **Body**: `{ "email": "usuario@ejemplo.com" }`

### POST `/auth/reset-password`
**Restablecer contraseña**
- **Descripción**: Cambia la contraseña usando el token de restablecimiento
- **Body**: `{ "token": "reset_token", "newPassword": "nueva_contraseña" }`

### GET `/auth/verify-reset-token/:token`
**Verificar token de restablecimiento**
- **Descripción**: Valida si un token de restablecimiento es válido
- **Respuesta**: `{ "valid": true/false }`

---

## 👥 Usuarios

### GET `/users/search`
**Buscar usuarios**
- **Descripción**: Busca usuarios por nombre o email
- **Query**: `?q=busqueda&limit=10`
- **Headers**: `Authorization: Bearer <token>`
- **Respuesta**: `{ "users": [...], "total": 5, "query": "busqueda" }`

### GET `/users/:userId/profile`
**Obtener perfil de usuario específico**
- **Descripción**: Devuelve el perfil público de un usuario
- **Headers**: `Authorization: Bearer <token>`
- **Respuesta**: Perfil público del usuario

---

## 📁 Proyectos

### POST `/projects`
**Crear proyecto**
- **Descripción**: Crea un nuevo proyecto
- **Body**: `{ "name": "Mi Proyecto", "description": "Descripción opcional" }`
- **Headers**: `Authorization: Bearer <token>`

### GET `/projects/mine`
**Obtener mis proyectos**
- **Descripción**: Lista todos los proyectos del usuario
- **Headers**: `Authorization: Bearer <token>`

### GET `/projects/:projectId`
**Obtener proyecto específico**
- **Descripción**: Devuelve los detalles de un proyecto
- **Headers**: `Authorization: Bearer <token>`

### DELETE `/projects/:projectId`
**Eliminar proyecto**
- **Descripción**: Elimina un proyecto (solo propietario)
- **Headers**: `Authorization: Bearer <token>`

### POST `/projects/:projectId/invite`
**Invitar miembro**
- **Descripción**: Invita a un usuario al proyecto
- **Body**: `{ "email": "usuario@ejemplo.com", "role": "MEMBER" }`
- **Headers**: `Authorization: Bearer <token>`

### GET `/projects/invitations/pending`
**Obtener invitaciones pendientes**
- **Descripción**: Lista las invitaciones pendientes del usuario
- **Headers**: `Authorization: Bearer <token>`

### PUT `/projects/invitations/:invitationId/respond`
**Responder invitación**
- **Descripción**: Acepta o rechaza una invitación
- **Body**: `{ "response": "ACCEPT" | "REJECT" }`
- **Headers**: `Authorization: Bearer <token>`

### PUT `/projects/:projectId/members/:memberId/role`
**Cambiar rol de miembro**
- **Descripción**: Cambia el rol de un miembro del proyecto
- **Body**: `{ "role": "ADMIN" | "MEMBER" | "VIEWER" }`
- **Headers**: `Authorization: Bearer <token>`

### POST `/projects/:projectId/sections`
**Crear sección**
- **Descripción**: Crea una nueva sección en el proyecto
- **Body**: `{ "name": "Nueva Sección" }`
- **Headers**: `Authorization: Bearer <token>`

### GET `/projects/:projectId/sections`
**Obtener secciones del proyecto**
- **Descripción**: Lista todas las secciones de un proyecto
- **Headers**: `Authorization: Bearer <token>`

### PUT `/projects/:projectId/sections/reorder`
**Reordenar secciones**
- **Descripción**: Cambia el orden de las secciones
- **Body**: `{ "sectionIds": [1, 2, 3] }`
- **Headers**: `Authorization: Bearer <token>`

### PUT `/projects/:projectId/sections/:sectionId`
**Actualizar sección**
- **Descripción**: Modifica una sección existente
- **Body**: `{ "name": "Nuevo Nombre" }`
- **Headers**: `Authorization: Bearer <token>`

### DELETE `/projects/:projectId/sections/:sectionId`
**Eliminar sección**
- **Descripción**: Elimina una sección del proyecto
- **Headers**: `Authorization: Bearer <token>`

---

## ✅ Tareas

### POST `/tasks`
**Crear tarea**
- **Descripción**: Crea una nueva tarea personal o de proyecto
- **Body**: `{ "title": "Mi Tarea", "description": "Descripción", "projectId": "uuid", "sectionId": 1 }`
- **Headers**: `Authorization: Bearer <token>`

### GET `/tasks/personal`
**Obtener tareas personales**
- **Descripción**: Lista las tareas personales del usuario
- **Headers**: `Authorization: Bearer <token>`

### GET `/tasks/project/:projectId`
**Obtener tareas del proyecto**
- **Descripción**: Lista todas las tareas de un proyecto
- **Headers**: `Authorization: Bearer <token>`

### GET `/tasks/project/:projectId/section/:sectionId`
**Obtener tareas de sección**
- **Descripción**: Lista las tareas de una sección específica
- **Headers**: `Authorization: Bearer <token>`

### GET `/tasks/:taskId`
**Obtener tarea específica**
- **Descripción**: Devuelve los detalles de una tarea
- **Headers**: `Authorization: Bearer <token>`

### PUT `/tasks/:taskId`
**Actualizar tarea**
- **Descripción**: Modifica una tarea existente
- **Body**: `{ "title": "Nuevo Título", "status": "COMPLETED" }`
- **Headers**: `Authorization: Bearer <token>`

### DELETE `/tasks/:taskId`
**Eliminar tarea**
- **Descripción**: Elimina una tarea
- **Headers**: `Authorization: Bearer <token>`

### POST `/tasks/:taskId/subtasks`
**Crear subtarea**
- **Descripción**: Crea una subtarea dentro de una tarea
- **Body**: `{ "title": "Subtarea" }`
- **Headers**: `Authorization: Bearer <token>`

### PUT `/tasks/:taskId/subtasks/:subtaskId`
**Actualizar subtarea**
- **Descripción**: Modifica una subtarea
- **Body**: `{ "title": "Nuevo Título", "completed": true }`
- **Headers**: `Authorization: Bearer <token>`

### DELETE `/tasks/:taskId/subtasks/:subtaskId`
**Eliminar subtarea**
- **Descripción**: Elimina una subtarea
- **Headers**: `Authorization: Bearer <token>`

### POST `/tasks/projects/:projectId/labels`
**Crear etiqueta**
- **Descripción**: Crea una nueva etiqueta para el proyecto
- **Body**: `{ "name": "Urgente", "color": "#ff0000" }`
- **Headers**: `Authorization: Bearer <token>`

### GET `/tasks/projects/:projectId/labels`
**Obtener etiquetas del proyecto**
- **Descripción**: Lista todas las etiquetas de un proyecto
- **Headers**: `Authorization: Bearer <token>`

### PUT `/tasks/projects/:projectId/labels/:labelId`
**Actualizar etiqueta**
- **Descripción**: Modifica una etiqueta existente
- **Body**: `{ "name": "Nuevo Nombre", "color": "#00ff00" }`
- **Headers**: `Authorization: Bearer <token>`

### DELETE `/tasks/projects/:projectId/labels/:labelId`
**Eliminar etiqueta**
- **Descripción**: Elimina una etiqueta del proyecto
- **Headers**: `Authorization: Bearer <token>`

---

## 💬 Chat

### GET `/chat/conversations`
**Obtener conversaciones**
- **Descripción**: Lista todas las conversaciones del usuario
- **Headers**: `Authorization: Bearer <token>`

### GET `/chat/direct/:userId`
**Obtener mensajes directos**
- **Descripción**: Obtiene mensajes de una conversación directa
- **Query**: `?page=1&limit=50`
- **Headers**: `Authorization: Bearer <token>`

### PUT `/chat/direct/:userId/read`
**Marcar conversación como leída**
- **Descripción**: Marca todos los mensajes de una conversación como leídos
- **Headers**: `Authorization: Bearer <token>`

### GET `/chat/project/:projectId`
**Obtener mensajes del proyecto**
- **Descripción**: Obtiene mensajes de un chat de proyecto
- **Query**: `?page=1&limit=50`
- **Headers**: `Authorization: Bearer <token>`

### POST `/chat/messages`
**Crear mensaje**
- **Descripción**: Envía un nuevo mensaje
- **Body**: `{ "content": "Hola", "projectId": "uuid" | "userId": "uuid" }`
- **Headers**: `Authorization: Bearer <token>`

### PUT `/chat/messages/:messageId`
**Actualizar mensaje**
- **Descripción**: Edita un mensaje existente
- **Body**: `{ "content": "Mensaje editado" }`
- **Headers**: `Authorization: Bearer <token>`

### DELETE `/chat/messages/:messageId`
**Eliminar mensaje**
- **Descripción**: Elimina un mensaje
- **Headers**: `Authorization: Bearer <token>`

### PUT `/chat/messages/:messageId/read`
**Marcar mensaje como leído**
- **Descripción**: Marca un mensaje específico como leído
- **Headers**: `Authorization: Bearer <token>`

### GET `/chat/search`
**Buscar mensajes**
- **Descripción**: Busca mensajes por contenido
- **Query**: `?q=busqueda&projectId=uuid&page=1&limit=20`
- **Headers**: `Authorization: Bearer <token>`

---

## 📞 Llamadas

### POST `/calls/start`
**Iniciar llamada**
- **Descripción**: Crea una nueva llamada
- **Body**: `{ "projectId": "uuid", "title": "Reunión" }`
- **Headers**: `Authorization: Bearer <token>`

### POST `/calls/join/:callId`
**Unirse a llamada**
- **Descripción**: Se une a una llamada existente
- **Body**: `{ "audioOnly": false }`
- **Headers**: `Authorization: Bearer <token>`

### PUT `/calls/leave/:callId`
**Salir de llamada**
- **Descripción**: Abandona una llamada
- **Headers**: `Authorization: Bearer <token>`

### DELETE `/calls/end/:callId`
**Terminar llamada**
- **Descripción**: Termina una llamada (solo iniciador)
- **Headers**: `Authorization: Bearer <token>`

### GET `/calls/active`
**Obtener llamadas activas**
- **Descripción**: Lista las llamadas activas del usuario
- **Headers**: `Authorization: Bearer <token>`

### GET `/calls/history`
**Obtener historial de llamadas**
- **Descripción**: Lista el historial de llamadas
- **Query**: `?page=1&limit=20`
- **Headers**: `Authorization: Bearer <token>`

### PUT `/calls/participant/:callId`
**Actualizar estado de participante**
- **Descripción**: Actualiza el estado en la llamada
- **Body**: `{ "muted": true, "videoEnabled": false }`
- **Headers**: `Authorization: Bearer <token>`

### POST `/calls/token/:callId`
**Generar token**
- **Descripción**: Genera un nuevo token para la llamada
- **Headers**: `Authorization: Bearer <token>`

### POST `/calls/meetings/project`
**Programar reunión de proyecto**
- **Descripción**: Programa una reunión para un proyecto
- **Body**: `{ "projectId": "uuid", "title": "Reunión", "startTime": "2024-01-01T10:00:00Z" }`
- **Headers**: `Authorization: Bearer <token>`

### POST `/calls/meetings/personal`
**Programar reunión personal**
- **Descripción**: Programa una reunión personal
- **Body**: `{ "title": "Reunión", "startTime": "2024-01-01T10:00:00Z", "participants": ["uuid"] }`
- **Headers**: `Authorization: Bearer <token>`

### GET `/calls/meetings/my`
**Obtener mis reuniones**
- **Descripción**: Lista las reuniones del usuario
- **Headers**: `Authorization: Bearer <token>`

### GET `/calls/meetings/project/:projectId`
**Obtener reuniones del proyecto**
- **Descripción**: Lista las reuniones de un proyecto
- **Headers**: `Authorization: Bearer <token>`

### GET `/calls/meetings/:meetingId`
**Obtener detalles de reunión**
- **Descripción**: Devuelve los detalles de una reunión
- **Headers**: `Authorization: Bearer <token>`

### DELETE `/calls/meetings/:meetingId`
**Cancelar reunión**
- **Descripción**: Cancela una reunión programada
- **Headers**: `Authorization: Bearer <token>`

---

## 📢 Anuncios

### POST `/projects/:projectId/announcements`
**Crear anuncio**
- **Descripción**: Crea un anuncio en un proyecto
- **Body**: `{ "title": "Anuncio", "content": "Contenido del anuncio" }`
- **Headers**: `Authorization: Bearer <token>`

### GET `/projects/:projectId/announcements`
**Obtener anuncios del proyecto**
- **Descripción**: Lista los anuncios de un proyecto
- **Headers**: `Authorization: Bearer <token>`

### GET `/auth/me/announcements`
**Obtener mis anuncios**
- **Descripción**: Lista todos los anuncios de los proyectos del usuario
- **Headers**: `Authorization: Bearer <token>`

### PUT `/announcements/:announcementId/read`
**Marcar anuncio como leído**
- **Descripción**: Marca un anuncio como leído
- **Headers**: `Authorization: Bearer <token>`

---

## 🌐 General

### GET `/`
**Health check**
- **Descripción**: Endpoint básico de verificación del servidor
- **Respuesta**: `"Hello World!"`

---

## 🔧 Notas Importantes

### Autenticación
- La mayoría de endpoints requieren autenticación JWT
- Incluir header: `Authorization: Bearer <token>`

### Parámetros
- Los IDs de proyecto y usuario son UUIDs
- Los IDs de sección y tarea son números enteros
- Las fechas deben estar en formato ISO 8601

### Respuestas de Error
- `400`: Error de validación o parámetros incorrectos
- `401`: No autenticado
- `403`: Sin permisos
- `404`: Recurso no encontrado
- `500`: Error interno del servidor

### Paginación
- Los endpoints que soportan paginación usan `page` y `limit`
- `page` comienza en 1
- `limit` máximo típico es 50

### Permisos
- Los proyectos tienen roles: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`
- Cada rol tiene diferentes permisos para acciones específicas 