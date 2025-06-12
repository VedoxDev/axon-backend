# Documentación de la API de Gestión de Roles 👑

Sistema completo de gestión de roles para miembros de proyecto. Solo los propietarios de proyecto pueden cambiar los roles de los miembros entre "member" y "admin".

## **Resumen de Endpoints**

### **🔐 Endpoints de Gestión de Roles**
| Método | Endpoint | Descripción | Auth | Permiso |
|--------|----------|-------------|------|------------|
| `PUT` | `/projects/:projectId/members/:memberId/role` | Cambiar role del miembro | ✅ JWT | Solo Propietario |

---

## **👑 PUT `/projects/:projectId/members/:memberId/role`**

Cambiar el role de un miembro del proyecto entre "member" y "admin". Solo los propietarios de proyectos pueden usar este endpoint.

### **Solicitud**
```http
PUT /projects/550e8400-e29b-41d4-a716-446655440000/members/user-uuid-123/role
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "role": "admin"
}
```

### **Parámetros de Ruta**
- `projectId` (UUID) - El ID del proyecto
- `memberId` (UUID) - El ID del usuario cuyo role será cambiado

### **Campos Requeridos**
```typescript
{
  role: "member" | "admin";  // Nuevo role para el miembro
}
```

### **Respuesta**
```json
{
  "message": "member-role-changed-successfully",
  "memberId": "user-uuid-123",
  "newRole": "admin",
  "memberName": "John Doe"
}
```

### **Ejemplos de Uso**

#### **Promover Miembro a Admin**
```http
PUT /projects/proj-123/members/user-456/role
Authorization: Bearer <jwt_token>

{
  "role": "admin"
}
```

#### **Degradar Admin a Miembro**
```http
PUT /projects/proj-123/members/user-789/role
Authorization: Bearer <jwt_token>

{
  "role": "member"
}
```

---

## **🔒 Reglas de Seguridad y Validación**

### **Control de Acceso**
- ✅ **Solo Propietario**: Solo los propietarios de proyecto pueden cambiar roles de miembros
- ✅ **JWT Requerido**: Debe estar autenticado con token JWT válido
- ✅ **Membresía del Proyecto**: El propietario debe ser miembro del proyecto

### **Reglas de Negocio**
- ✅ **Validación de Role**: Solo acepta valores "member" o "admin"
- ✅ **No Puede Cambiar Propietario**: El role de propietario está protegido y no puede ser modificado
- ✅ **No Puede Cambiar Propio Role**: El propietario no puede cambiar su propio role
- ✅ **El Miembro Debe Existir**: El miembro objetivo debe existir en el proyecto
- ✅ **El Proyecto Debe Existir**: El proyecto debe existir y ser accesible

### **Permisos de Roles Después del Cambio**

#### **Permisos del Role Miembro:**
- `VIEW_PROJECT` - Puede ver detalles del proyecto
- `CREATE_TASK` - Puede crear nuevas tareas

#### **Permisos del Role Admin:**
- `VIEW_PROJECT` - Puede ver detalles del proyecto
- `EDIT_PROJECT` - Puede modificar configuraciones del proyecto
- `MANAGE_MEMBERS` - Puede invitar nuevos miembros
- `CREATE_TASK` - Puede crear nuevas tareas
- `ASSIGN_TASK` - Puede asignar tareas a miembros
- `MANAGE_SECTIONS` - Puede crear/editar/eliminar secciones

#### **Permisos del Role Propietario (Sin Cambios):**
- Todos los permisos de admin MÁS:
- `DELETE_PROJECT` - Puede eliminar todo el proyecto
- `CHANGE_MEMBER_ROLES` - Puede promover/degradar miembros

---

## **🚨 Respuestas de Error**

### **Prohibido - No es Propietario (403)**
```json
{
  "statusCode": 403,
  "message": "only-owner-can-change-roles",
  "error": "Forbidden"
}
```

### **Proyecto No Encontrado (404)**
```json
{
  "statusCode": 404,
  "message": "project-not-found",
  "error": "Not Found"
}
```

### **Miembro No Encontrado (404)**
```json
{
  "statusCode": 404,
  "message": "member-not-found",
  "error": "Not Found"
}
```

### **No Se Puede Cambiar Role del Propietario (400)**
```json
{
  "statusCode": 400,
  "message": "cannot-change-owner-role",
  "error": "Bad Request"
}
```

### **No Se Puede Cambiar Propio Role (400)**
```json
{
  "statusCode": 400,
  "message": "cannot-change-own-role",
  "error": "Bad Request"
}
```

### **Valor de Role Inválido (400)**
```json
{
  "statusCode": 400,
  "message": [
    "role-must-be-member-or-admin"
  ],
  "error": "Bad Request"
}
```

### **UUID Inválido (400)**
```json
{
  "statusCode": 400,
  "message": "invalid-project-id",
  "error": "Bad Request"
}
```

---

## **💻 Implementación Frontend**

### **Función de Cambio de Role**
```typescript
const cambiarRoleMiembro = async (projectId: string, memberId: string, nuevoRole: 'member' | 'admin') => {
  try {
    const response = await api.put(`/projects/${projectId}/members/${memberId}/role`, {
      role: nuevoRole
    });
    
    console.log('Role cambiado exitosamente:', response.data);
    
    // Actualizar estado local
    setProjectMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, role: nuevoRole }
        : member
    ));
    
    // Mostrar mensaje de éxito
    mostrarNotificacion({
      type: 'success',
      message: `${response.data.memberName} ahora es ${nuevoRole === 'admin' ? 'un admin' : 'un miembro'}`
    });
    
  } catch (error) {
    manejarErrorCambioRole(error);
  }
};
```

### **Manejo de Errores**
```typescript
const manejarErrorCambioRole = (error: any) => {
  const mensajeError = error.response?.data?.message || 'Error al cambiar role';
  
  switch (mensajeError) {
    case 'only-owner-can-change-roles':
      mostrarNotificacion({
        type: 'error',
        message: 'Solo los propietarios del proyecto pueden cambiar roles de miembros'
      });
      break;
    case 'cannot-change-owner-role':
      mostrarNotificacion({
        type: 'error', 
        message: 'No se puede cambiar el role del propietario'
      });
      break;
    case 'cannot-change-own-role':
      mostrarNotificacion({
        type: 'error',
        message: 'No puedes cambiar tu propio role'
      });
      break;
    default:
      mostrarNotificacion({
        type: 'error',
        message: 'Error al cambiar role del miembro. Por favor intenta de nuevo.'
      });
  }
};
```

### **Ejemplo de Componente UI**
```typescript
const SelectorRoleMiembro = ({ member, projectId, roleUsuarioActual, idUsuarioActual }) => {
  const esPropietario = roleUsuarioActual === 'owner';
  const esPerfilPropio = member.id === idUsuarioActual;
  const puedecambiarRole = esPropietario && !esPerfilPropio && member.role !== 'owner';

  if (!puedecambiarRole) {
    return <span className="role-badge">{member.role}</span>;
  }

  return (
    <select 
      value={member.role}
      onChange={(e) => cambiarRoleMiembro(projectId, member.id, e.target.value)}
      className="role-selector"
    >
      <option value="member">Miembro</option>
      <option value="admin">Admin</option>
    </select>
  );
};
```

---

## **📋 Ejemplos de Pruebas**

### **Cambio de Role Válido**
```bash
curl -X PUT "http://localhost:3000/projects/proj-123/members/user-456/role" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### **Respuesta de Éxito Esperada**
```json
{
  "message": "member-role-changed-successfully",
  "memberId": "user-456", 
  "newRole": "admin",
  "memberName": "John Smith"
}
```

---

## **⚡ Características Clave**

### **✅ Control de Acceso Seguro**
- Solo los propietarios del proyecto pueden cambiar roles
- No se puede modificar el role del propietario (protegido)
- No se puede cambiar el propio role (previene bloqueo)

### **✅ Validación Inteligente**
- Validación UUID para todos los parámetros
- Validación enum de role (solo member/admin)
- Verificación de existencia del miembro

### **✅ Mensajes de Error Claros**
- Códigos de error descriptivos para todos los escenarios
- Manejo de errores amigable para frontend
- Formato de respuesta API consistente

### **✅ Listo para Auditoría**
- Retorna información del miembro cambiado
- Incluye nombre del miembro para registro
- Respuestas claras de éxito/fallo

---

## **🔮 Jerarquía de Roles**

```
👑 Propietario
├── Todos los permisos
├── Puede eliminar proyecto
├── Puede cambiar roles de miembros
├── No puede ser cambiado/removido
└── Establecido automáticamente al crear proyecto

🛡️ Admin  
├── La mayoría de permisos
├── Puede gestionar miembros y secciones
├── Puede asignar tareas
├── No puede eliminar proyecto
└── Puede ser promovido/degradado por propietario

👤 Miembro
├── Permisos básicos
├── Puede ver proyecto y crear tareas
├── No puede gestionar miembros
├── No puede gestionar secciones  
└── Puede ser promovido a admin por propietario
```

---

*¡Este sistema proporciona gestión de roles segura y flexible mientras mantiene el control de acceso adecuado!* 🔐✨ 