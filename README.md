# Axon - Backend 🚀

**Proyecto desarrollado por Victor Fonseca y Ranzes Mata**  
**Backend del Trabajo de Fin de Grado (TFG)** 🎓

Este repositorio contiene el backend de la aplicación **Axon**, una plataforma colaborativa que permite la gestión de proyectos, tareas, usuarios y comunicación en tiempo real. 🛠️

## Tecnologías principales 🧰
- **NestJS** (Framework backend)
- **TypeORM** (ORM para conexión con PostgreSQL)
- **PostgreSQL** (Base de datos relacional)
- **JWT** (Autenticación con tokens)
- **Bcrypt** (Hash de contraseñas)

## Funcionalidades principales actuales ✅
- Registro y login de usuarios con validación de datos. 
- Autenticación protegida por JWT 🔐
- Endpoint `auth/me` para obtener el perfil del usuario logueado 👤
- Creación de proyectos y asignación automática del creador como miembro con rol `owner` 🏗️

## En desarrollo 🚧
- Gestión de miembros en proyectos 👥
- Gestión de tareas colaborativas ✅
- Sistema de roles y permisos 🛡️
- Chats y videollamadas en tiempo real 💬🎥

## Estructura de carpetas 🗂️
```
src/
├── auth/              # Módulo de autenticación
├── common/            # Pipes, decoradores y utilidades compartidas
├── projects/          # Lógica relacionada con los proyectos y miembros
├── users/             # Gestión de usuarios
└── main.ts            # Punto de entrada de la aplicación
```

## Requisitos para ejecutar 🧪
- Node.js v22.12.0 
- PostgreSQL (configurar variables en `.env`)

## Instalación ⚙️
```bash
npm install
npm run start:dev
```

## Notas adicionales 📌
- Las validaciones están centralizadas usando un Pipe personalizado.
- El sistema está pensado para escalar, usando relaciones `@ManyToOne` y `@OneToMany` con TypeORM.

---
**Repositorio gestionado por ambos autores.** 🤝

