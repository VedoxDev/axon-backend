# Axon - Backend 🚀

**Proyecto desarrollado por Victor Fonseca y Ranzes Mata**  
**Backend del Trabajo de Fin de Grado (TFG)** 🎓

Este repositorio contiene el backend de la aplicación **Axon**, una plataforma colaborativa completa que permite la gestión integral de proyectos, tareas, usuarios, comunicación en tiempo real y videollamadas. 🛠️

## Tecnologías principales 🧰
- **NestJS** (Framework backend con TypeScript)
- **TypeORM** (ORM para conexión con PostgreSQL)
- **PostgreSQL** (Base de datos relacional)
- **JWT** (Autenticación con tokens)
- **Bcrypt** (Hash de contraseñas)
- **Socket.IO** (Comunicación en tiempo real para chat)
- **LiveKit** (Plataforma de videollamadas y audio)
- **Nodemailer** (Envío de emails para recuperación de contraseñas)
- **Class Validator & Transformer** (Validación y transformación de datos)

## Funcionalidades implementadas ✅

### 🔐 **Sistema de Autenticación Completo**
- Registro y login de usuarios con validación robusta
- Autenticación protegida por JWT
- Sistema de recuperación de contraseñas por email
- Cambio de contraseñas con validación de contraseña actual
- Endpoint `auth/me` para obtener perfil del usuario logueado
- Tokens de restablecimiento con expiración temporal

### 👥 **Gestión Avanzada de Usuarios**
- Perfiles de usuario completos con información personal
- Búsqueda rápida de usuarios por nombre/email
- Sistema de roles y permisos granular
- Gestión de miembros en proyectos con diferentes niveles de acceso

### 🏗️ **Gestión Completa de Proyectos**
- Creación de proyectos con asignación automática del creador como owner
- Sistema de invitaciones a proyectos con aceptación/rechazo
- Gestión de miembros con roles: `owner`, `admin`, `member`, `viewer`
- Permisos granulares por rol (ver, editar, gestionar miembros, eliminar)
- Eliminación de proyectos con validación de permisos

### 📋 **Sistema Kanban Avanzado**
- Creación y gestión de secciones (columnas Kanban)
- Reordenamiento de secciones mediante drag & drop
- Actualización y eliminación de secciones
- Organización visual de tareas por estados

### ✅ **Gestión Completa de Tareas**
- Creación de tareas personales y de proyecto
- Asignación de tareas a miembros del proyecto
- Sistema de subtareas con gestión independiente
- Etiquetas personalizables con colores
- Estados de tareas (pendiente, en progreso, completada)
- Fechas de vencimiento y prioridades
- Filtrado por sección, proyecto y usuario

### 💬 **Chat en Tiempo Real**
- Mensajes directos entre usuarios
- Chat grupal por proyecto
- Mensajería en tiempo real con WebSockets
- Historial de conversaciones paginado
- Marcado de mensajes como leídos
- Búsqueda de mensajes en conversaciones
- Edición y eliminación de mensajes

### 🎥 **Sistema de Videollamadas Profesional**
- Videollamadas individuales y grupales
- Integración completa con LiveKit
- Programación de reuniones (personales y de proyecto)
- Historial de llamadas y reuniones
- Control de audio/video durante llamadas
- Tokens de acceso seguros para salas
- Webhooks para eventos de LiveKit
- Gestión de participantes en tiempo real

### 📢 **Sistema de Anuncios**
- Creación de anuncios por proyecto
- Notificaciones de anuncios para miembros
- Marcado de anuncios como leídos
- Vista centralizada de anuncios del usuario
- Permisos para gestión de anuncios

### 🔒 **Sistema de Permisos Granular**
- Control de acceso basado en roles
- Permisos específicos por funcionalidad:
  - `VIEW_PROJECT` - Ver proyecto
  - `EDIT_PROJECT` - Editar proyecto  
  - `MANAGE_MEMBERS` - Gestionar miembros
  - `DELETE_PROJECT` - Eliminar proyecto
  - `CREATE_TASK` - Crear tareas
  - `ASSIGN_TASK` - Asignar tareas
  - `MANAGE_SECTIONS` - Gestionar secciones Kanban
  - `MANAGE_ANNOUNCEMENTS` - Gestionar anuncios

## Estructura de carpetas 🗂️
```
src/
├── auth/                    # Autenticación y autorización
│   ├── dto/                # DTOs para login, registro, cambio contraseña
│   ├── strategies/         # Estrategias JWT para Passport
│   └── guards/            # Guards de autenticación
├── users/                  # Gestión de usuarios
│   ├── dto/               # DTOs para usuarios
│   └── user.entity.ts     # Entidad de usuario
├── projects/              # Lógica de proyectos y miembros
│   ├── dto/               # DTOs para proyectos e invitaciones
│   └── entities/          # Entidades de proyecto y membresía
├── sections/              # Gestión de secciones Kanban
│   ├── dto/               # DTOs para secciones
│   └── entities/          # Entidad de sección
├── tasks/                 # Sistema completo de tareas
│   ├── dto/               # DTOs para tareas, subtareas y etiquetas
│   ├── entities/          # Entidades de tarea, subtarea y etiqueta
│   └── constants/         # Constantes de estados y prioridades
├── chat/                  # Sistema de mensajería
│   ├── dto/               # DTOs para mensajes
│   ├── entities/          # Entidades de mensaje y conversación
│   └── chat.gateway.ts    # Gateway WebSocket para tiempo real
├── calls/                 # Sistema de videollamadas
│   ├── dto/               # DTOs para llamadas y reuniones
│   ├── entities/          # Entidades de llamada y reunión
│   └── calls.service.ts   # Integración con LiveKit
├── announcements/         # Sistema de anuncios
│   ├── dto/               # DTOs para anuncios
│   └── entities/          # Entidad de anuncio
├── common/                # Utilidades compartidas
│   ├── decorators/        # Decoradores personalizados
│   ├── guards/            # Guards de permisos
│   ├── pipes/             # Pipes de validación
│   ├── enums/             # Enumeraciones (permisos, roles)
│   └── utils/             # Utilidades generales
└── main.ts               # Punto de entrada con configuración CORS
```

## Características técnicas avanzadas 🔧

### **Validación y Seguridad**
- Pipe personalizado de validación condicional
- Validación robusta de UUIDs y parámetros
- Sanitización de datos de entrada
- Protección CORS configurada para desarrollo y producción
- Hash seguro de contraseñas con bcrypt

### **Base de Datos**
- Relaciones complejas con TypeORM (`@ManyToOne`, `@OneToMany`, `@ManyToMany`)
- Sincronización automática de esquemas
- Configuración de zona horaria europea (Madrid)
- Índices optimizados para consultas frecuentes

### **Tiempo Real**
- WebSocket Gateway para chat en tiempo real
- Eventos de conexión/desconexión de usuarios
- Notificaciones instantáneas de mensajes
- Integración con LiveKit para videollamadas

### **Escalabilidad**
- Arquitectura modular con separación de responsabilidades
- Servicios independientes por funcionalidad
- Paginación en endpoints de listado
- Optimización de consultas con relaciones

## Requisitos para ejecutar 🧪
- **Node.js** v22.12.0 o superior
- **PostgreSQL** (configurar variables en `.env`)
- **LiveKit Server** (para videollamadas)
- **Servidor SMTP** (para emails de recuperación)

## Variables de entorno requeridas 🔧
```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASS=tu_contraseña
DB_NAME=axon_db

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro

# Servidor
PORT=3000

# LiveKit (para videollamadas)
LIVEKIT_API_KEY=tu_livekit_api_key
LIVEKIT_API_SECRET=tu_livekit_secret
LIVEKIT_WS_URL=wss://tu-livekit-server.com

# Email (para recuperación de contraseñas)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_app
```

## Instalación ⚙️
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar en desarrollo
npm run start:dev

# Ejecutar en producción
npm run build
npm run start:prod
```

## Documentación API 📚
El proyecto incluye documentación completa de todas las APIs en la carpeta `/docs`:

- **Autenticación**: Login, registro, recuperación de contraseñas
- **Usuarios**: Búsqueda y perfiles de usuario
- **Proyectos**: Gestión completa de proyectos y miembros
- **Tareas**: Sistema Kanban con tareas y subtareas
- **Chat**: Mensajería en tiempo real
- **Videollamadas**: Sistema completo de llamadas y reuniones
- **Anuncios**: Sistema de notificaciones por proyecto

## Estado del proyecto 📊
**✅ COMPLETAMENTE FUNCIONAL** - Todas las funcionalidades principales están implementadas y probadas:

- ✅ Sistema de autenticación completo
- ✅ Gestión de usuarios y perfiles
- ✅ Proyectos con roles y permisos
- ✅ Sistema Kanban con secciones y tareas
- ✅ Chat en tiempo real con WebSockets
- ✅ Videollamadas con LiveKit
- ✅ Sistema de anuncios
- ✅ Recuperación de contraseñas por email
- ✅ API REST completa y documentada
- ✅ Validaciones y seguridad implementadas

## Próximas mejoras 🚀
- Notificaciones push para móviles
- Sistema de archivos adjuntos
- Integración con calendarios externos
- Métricas y analytics de proyectos
- API de webhooks para integraciones externas

---
**Repositorio desarrollado por Victor Fonseca y Ranzes Mata** 🤝  
**Trabajo de Fin de Grado - Backend completo y funcional** 🎓

